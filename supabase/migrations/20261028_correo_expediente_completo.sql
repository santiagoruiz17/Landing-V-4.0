-- Correo "documentación completa" (2026-10-28)
-- Problema: el correo solo salía si el cliente pulsaba "Enviar documentación" y, una vez enviado (aunque fuera con documentos faltantes),
-- ya no se volvía a mandar. Clientes que dejaron el formulario incompleto, volvían, subían lo que faltaba y al equipo no le llegaba nada.
--  1) El correo ahora distingue "completa" de "enviada, faltan documentos"; solo la completa cierra el trámite de aviso.
--  2) Un cron (cada 5 min) avisa solo cuando el expediente queda completo, aunque el cliente no pulse el botón.
--  3) El resumen de faltantes toma el banco real donde subió los estados de cuenta (antes exigía siempre el "banco 1").
--  4) Mientras no se publique el paso a paso (docs_por_pasos_activo = false) el resumen usa las reglas del formulario anterior;
--     al publicarlo: update site_config set docs_por_pasos_activo = true.

alter table public.leads add column if not exists expediente_completo_notificado_at timestamptz;
alter table public.site_config add column if not exists docs_por_pasos_activo boolean not null default false;

-- Resumen de documentos obligatorios y faltantes
create or replace function public._lead_resumen_documentos(p_lead_id uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_moral boolean;
  v_distinto boolean;
  v_pasos boolean;
  v_n_acc int;
  v_total int;
  v_subidos int;
  v_faltan text[];
begin
  select coalesce(constitucion = 'Persona Moral', false), coalesce(domicilio_fiscal_distinto, false)
    into v_moral, v_distinto
    from public.leads where id = p_lead_id;
  select coalesce((select docs_por_pasos_activo from public.site_config limit 1), false) into v_pasos;

  create temporary table if not exists _exp_docs (tipo text, slot int, etiqueta text) on commit drop;
  truncate _exp_docs;

  insert into _exp_docs values
    ('constancia_situacion_fiscal', 1, 'Constancia de situación fiscal'),
    ('declaracion_anual', 1, public._document_label('declaracion_anual', 1));

  if v_pasos then
    -- Reglas del paso a paso: acuse aparte; domicilio operativo siempre; fiscal solo si es distinto
    insert into _exp_docs values
      ('acuse_declaracion_anual', 1, public._document_label('acuse_declaracion_anual', 1)),
      ('comprobante_domicilio_operativo', 1, 'Comprobante de domicilio operativo');
    if v_distinto then
      insert into _exp_docs values ('comprobante_domicilio_fiscal', 1, 'Comprobante de domicilio fiscal');
    end if;
  else
    -- Reglas del formulario anterior
    insert into _exp_docs values ('comprobante_domicilio_fiscal', 1, 'Comprobante de domicilio fiscal');
  end if;

  if v_moral then
    insert into _exp_docs values ('acta_constitutiva', 1, 'Acta constitutiva');
    if not v_pasos then
      insert into _exp_docs values ('comprobante_domicilio_operativo', 1, 'Comprobante de domicilio operativo');
    end if;
    select count(*) into v_n_acc from public.lead_accionistas where lead_id = p_lead_id;
    -- Representante legal (y, con el paso a paso, también el accionista mayoritario) o el único accionista
    insert into _exp_docs
    select x.tipo, a.slot_index + x.off, x.etq || ' (' || coalesce(nullif(a.nombre, ''), 'accionista ' || a.slot_index) || ')'
    from public.lead_accionistas a
    cross join (values
      ('ine_accionista', 0, 'INE del accionista — frente'),
      ('ine_accionista', 100, 'INE del accionista — reverso'),
      ('comprobante_domicilio_accionista', 0, 'Comprobante de domicilio del accionista'),
      ('constancia_situacion_fiscal_accionista', 0, 'Constancia fiscal del accionista')
    ) as x(tipo, off, etq)
    where a.lead_id = p_lead_id
      and (a.es_representante_legal or (v_pasos and a.es_mayoritario) or v_n_acc = 1);
  else
    insert into _exp_docs values
      ('ine', 1, 'INE — frente'),
      ('ine', 2, 'INE — reverso'),
      ('comprobante_domicilio_particular', 1, 'Comprobante de domicilio particular');
    if v_pasos then
      insert into _exp_docs values ('comprobante_domicilio_operativo', 1, 'Comprobante de domicilio operativo');
    end if;
  end if;

  -- Estados de cuenta: 6 meses por cada banco que el cliente usó (con nombre guardado o con archivos subidos).
  -- Si no hay ninguno todavía, se espera uno.
  insert into _exp_docs
  select 'estado_cuenta', b.slot * 10 + m,
         'Estado de cuenta ' || coalesce(nullif(b.nombre, ''), 'banco ' || b.slot) || ' — mes ' || m
  from (
    select g.slot, (select nullif(x.nombre_banco, '') from public.lead_bancos x where x.lead_id = p_lead_id and x.slot_index = g.slot) as nombre
    from (
      select slot_index::int as slot from public.lead_bancos where lead_id = p_lead_id and nullif(nombre_banco, '') is not null
      union
      select (slot_index / 10)::int from public.lead_documentos where lead_id = p_lead_id and tipo_documento = 'estado_cuenta'
    ) g
    union all
    select 1, null
    where not exists (select 1 from public.lead_bancos where lead_id = p_lead_id and nullif(nombre_banco, '') is not null)
      and not exists (select 1 from public.lead_documentos where lead_id = p_lead_id and tipo_documento = 'estado_cuenta')
  ) b
  cross join generate_series(1, 6) as m;

  select count(*) into v_total from _exp_docs;
  select count(*) into v_subidos
    from _exp_docs e
    where exists (select 1 from public.lead_documentos d where d.lead_id = p_lead_id and d.tipo_documento = e.tipo and d.slot_index = e.slot);
  select coalesce(array_agg(e.etiqueta order by e.tipo, e.slot), '{}') into v_faltan
    from _exp_docs e
    where not exists (select 1 from public.lead_documentos d where d.lead_id = p_lead_id and d.tipo_documento = e.tipo and d.slot_index = e.slot);

  return jsonb_build_object('total', v_total, 'subidos', v_subidos, 'faltan', to_jsonb(v_faltan));
end;
$function$;

-- Correo al equipo: "completa" vs "enviada, faltan documentos"; el aviso de "completa" se puede mandar de nuevo si antes se envió incompleto.
do $parche$
declare
  d text;
  procedure_name constant text := 'send_lead_documentos_email';
begin
  select pg_get_functiondef(p.oid) into d from pg_proc p where p.proname = procedure_name and p.pronamespace = 'public'::regnamespace;
  if d is null then raise exception 'no existe %', procedure_name; end if;
  if position('v_es_completo' in d) > 0 then
    raise notice 'send_lead_documentos_email ya estaba parchada';
    return;
  end if;

  -- variable nueva
  d := replace(d, E'  v_after text;\nbegin', E'  v_after text;\n  v_es_completo boolean;\nbegin');

  -- guardia: el aviso de completo se puede repetir si antes se mandó incompleto y ahora ya está completo
  d := replace(d,
    $q$  if p_kind = 'completo' and v_lead.documentos_email_enviado then
    return jsonb_build_object('sent', false, 'reason', 'already_sent');
  end if;$q$,
    $q$  v_resumen := public._lead_resumen_documentos(p_lead_id);
  v_es_completo := jsonb_array_length(v_resumen->'faltan') = 0;
  if p_kind = 'completo' and v_lead.documentos_email_enviado
     and (not v_es_completo or v_lead.expediente_completo_notificado_at is not null) then
    return jsonb_build_object('sent', false, 'reason', 'already_sent');
  end if;$q$);

  -- encabezado del correo cuando se envía con faltantes
  d := replace(d,
    $q$  if p_kind = 'completo' then
    v_color := '#006d4e';$q$,
    $q$  if p_kind = 'completo' and not v_es_completo then
    v_color := '#b45309';
    v_kicker := 'Documentación enviada · incompleta';
    v_title := coalesce(public._esc(v_lead.nombre_completo), 'El lead') || ' envió su documentación, pero aún faltan documentos';
    v_sub := 'Revisa lo que falta y contáctalo para completar el expediente.';
    v_after := public._team_nota('#fffbeb', '#d97706', '#92400e', '<strong>Acción sugerida:</strong> contactar al lead para pedirle los documentos que faltan. Cuando los suba y el expediente quede completo, recibirás otro correo.');
  elsif p_kind = 'completo' then
    v_color := '#006d4e';$q$);

  -- asunto
  d := replace(d,
    $q$case when p_kind='completo' then '📄 Documentación completa (' || v_subidos || '/' || v_total || ') — ' || coalesce(v_lead.nombre_completo, '')$q$,
    $q$case when p_kind='completo' and v_es_completo then '📄 Documentación completa (' || v_subidos || '/' || v_total || ') — ' || coalesce(v_lead.nombre_completo, '')
                      when p_kind='completo' then '📤 Documentación enviada, faltan documentos (' || v_subidos || '/' || v_total || ') — ' || coalesce(v_lead.nombre_completo, '')$q$);

  -- marcas al enviar con éxito
  d := replace(d,
    $q$    if p_kind = 'completo' then
      update public.leads set documentos_email_enviado = true, documentos_status = 'completo', documentos_completado_at = now() where id = p_lead_id;
    else$q$,
    $q$    if p_kind = 'completo' and v_es_completo then
      update public.leads set documentos_email_enviado = true, documentos_status = 'completo', documentos_completado_at = now(),
        expediente_completo_notificado_at = now(), documentos_incompleto_email_enviado = true where id = p_lead_id;
    elsif p_kind = 'completo' then
      update public.leads set documentos_email_enviado = true, documentos_incompleto_email_enviado = true where id = p_lead_id;
    else$q$);

  if position('v_es_completo' in d) = 0 or position('expediente_completo_notificado_at = now()' in d) = 0
     or position('Documentación enviada · incompleta' in d) = 0 or position('faltan documentos (' in d) = 0
     or position('not v_es_completo or v_lead.expediente' in d) = 0 then
    raise exception 'el parche de send_lead_documentos_email no se aplicó completo';
  end if;
  execute d;
end
$parche$;

-- Aviso automático cuando el expediente queda completo (cada 5 min): no depende de que el cliente pulse "Enviar".
create or replace function public.revisar_expedientes_completos()
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  r record;
  v_res jsonb;
begin
  for r in
    select l.id,
           (select max(d.created_at) from public.lead_documentos d where d.lead_id = l.id) as ultima_carga,
           (l.ciec_encrypted is not null or l.ciec_purgada_at is not null) as tiene_ciec
    from public.leads l
    where l.expediente_completo_notificado_at is null
      and exists (select 1 from public.lead_documentos d where d.lead_id = l.id and d.purgado_at is null and d.created_at > now() - interval '7 days')
  loop
    -- Se espera a que el cliente deje de subir (5 min) para no avisar a medias
    continue when r.ultima_carga > now() - interval '5 minutes';
    -- Con CIEC se avisa en cuanto está todo; sin CIEC se da una hora de margen y se avisa de todos modos
    continue when not r.tiene_ciec and r.ultima_carga > now() - interval '60 minutes';
    v_res := public._lead_resumen_documentos(r.id);
    continue when jsonb_array_length(v_res->'faltan') > 0;
    begin
      perform public.send_lead_documentos_email(r.id, 'completo');
    exception when others then
      raise warning 'revisar_expedientes_completos: lead %: %', r.id, sqlerrm;
    end;
  end loop;
end;
$function$;
revoke all on function public.revisar_expedientes_completos() from public;
grant execute on function public.revisar_expedientes_completos() to postgres, service_role;

-- Leads a los que ya se les había avisado de "completo" y hoy están completos: no se les vuelve a avisar.
do $$
declare r record;
begin
  set local session_replication_role = replica;  -- sin disparar avisos por actualizar la fila
  for r in select id, documentos_completado_at from public.leads where documentos_email_enviado and expediente_completo_notificado_at is null loop
    if jsonb_array_length(public._lead_resumen_documentos(r.id)->'faltan') = 0 then
      update public.leads set expediente_completo_notificado_at = coalesce(r.documentos_completado_at, now()) where id = r.id;
    end if;
  end loop;
end $$;

select cron.unschedule('revisar-expedientes-completos') where exists (select 1 from cron.job where jobname = 'revisar-expedientes-completos');
select cron.schedule('revisar-expedientes-completos', '*/5 * * * *', 'select public.revisar_expedientes_completos();');
