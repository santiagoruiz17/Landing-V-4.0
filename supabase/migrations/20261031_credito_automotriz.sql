-- 2026-10-31 · Crédito automotriz en /documentacion
-- La liga de documentos ahora empieza eligiendo producto: Crédito empresarial (formularios de siempre, sin cambios) o Crédito automotriz.
-- Automotriz: persona física (asalariado), persona física con actividad empresarial o persona moral, cada una con su lista corta de documentos.
-- Un mismo correo puede tener un trámite empresarial y otro automotriz (son leads distintos, cada uno con sus documentos).

alter table public.leads add column if not exists producto text not null default 'empresarial';
alter table public.leads drop constraint if exists leads_producto_check;
alter table public.leads add constraint leads_producto_check check (producto in ('empresarial', 'automotriz'));

-- Alta desde la liga de documentos
create or replace function public.registrar_lead_documentacion_directa(p jsonb)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_id uuid;
  v_correo text := lower(trim(p->>'correo'));
  v_constitucion text := p->>'constitucion';
  v_producto text := coalesce(nullif(p->>'producto', ''), 'empresarial');
  v_envio jsonb;
begin
  if v_producto not in ('empresarial', 'automotriz') then
    raise exception 'producto invalido: %', v_producto;
  end if;
  if v_constitucion not in ('Persona Física con Actividad Empresarial', 'Persona Moral')
     and not (v_producto = 'automotriz' and v_constitucion = 'Persona Física (asalariado)') then
    raise exception 'constitucion invalida: %', v_constitucion;
  end if;
  if coalesce(trim(p->>'nombreCompleto'), '') = '' then
    raise exception 'Falta el nombre';
  end if;
  if v_correo = '' then
    raise exception 'Falta el correo';
  end if;

  select id into v_id
  from public.leads
  where lower(trim(correo)) = v_correo and producto = v_producto
  order by created_at desc
  limit 1;

  if v_id is not null then
    if public._lead_tiene_avance(v_id) then
      v_envio := public._enviar_codigo_lead(v_id);
      return jsonb_build_object('status', 'codigo', 'sent', coalesce((v_envio->>'sent')::boolean, false), 'reason', v_envio->>'reason');
    end if;

    update public.leads set
      nombre_completo = p->>'nombreCompleto',
      numero = p->>'numero',
      correo = p->>'correo',
      constitucion = v_constitucion,
      empresa = nullif(p->>'empresa', ''),
      updated_at = now()
    where id = v_id;
    perform public._avisar_registro_documentacion(v_id);
    return jsonb_build_object('status', 'nuevo', 'leadId', v_id);
  end if;

  insert into public.leads (
    nombre_completo, numero, correo, constitucion, empresa, calificado, evento, producto
  ) values (
    p->>'nombreCompleto', p->>'numero', p->>'correo', v_constitucion, nullif(p->>'empresa', ''),
    true, 'documentacion_directa', v_producto
  ) returning id into v_id;

  perform public._avisar_registro_documentacion(v_id);
  return jsonb_build_object('status', 'nuevo', 'leadId', v_id);
end;
$function$;

-- Código por correo: ahora distingue el producto (si no se manda, funciona como antes)
drop function if exists public.solicitar_codigo_lead(text);
create or replace function public.solicitar_codigo_lead(p_correo text, p_producto text default null)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_id uuid;
begin
  select id into v_id
  from public.leads
  where lower(trim(correo)) = lower(trim(p_correo))
    and (p_producto is null or producto = p_producto)
  order by created_at desc
  limit 1;

  if v_id is null or not public._lead_tiene_avance(v_id) then
    return jsonb_build_object('sent', false, 'reason', 'no_aplica');
  end if;
  return public._enviar_codigo_lead(v_id);
end;
$function$;
revoke all on function public.solicitar_codigo_lead(text, text) from public;
grant execute on function public.solicitar_codigo_lead(text, text) to anon, authenticated, service_role;

drop function if exists public.verificar_codigo_lead(text, text);
create or replace function public.verificar_codigo_lead(p_correo text, p_codigo text, p_producto text default null)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
declare
  v_lead public.leads;
  v_cod public.lead_codigos_acceso;
begin
  select * into v_lead
  from public.leads
  where lower(trim(correo)) = lower(trim(p_correo))
    and (p_producto is null or producto = p_producto)
  order by created_at desc
  limit 1;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'invalido');
  end if;

  select * into v_cod
  from public.lead_codigos_acceso
  where lead_id = v_lead.id and not usado and expires_at > now()
  order by created_at desc
  limit 1;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'expirado');
  end if;

  if v_cod.intentos >= 5 then
    update public.lead_codigos_acceso set usado = true where id = v_cod.id;
    return jsonb_build_object('ok', false, 'reason', 'bloqueado');
  end if;

  if v_cod.codigo_hash = encode(extensions.digest(trim(coalesce(p_codigo, '')) || ':' || v_lead.id::text, 'sha256'), 'hex') then
    update public.lead_codigos_acceso set usado = true where id = v_cod.id;
    return jsonb_build_object(
      'ok', true,
      'leadId', v_lead.id,
      'tipo', case when v_lead.constitucion = 'Persona Moral' then 'moral'
                   when v_lead.constitucion = 'Persona Física (asalariado)' then 'asalariado'
                   else 'fisica' end,
      'producto', v_lead.producto
    );
  end if;

  update public.lead_codigos_acceso set intentos = intentos + 1 where id = v_cod.id;
  return jsonb_build_object('ok', false, 'reason', 'invalido', 'intentosRestantes', greatest(0, 4 - v_cod.intentos));
end;
$function$;
revoke all on function public.verificar_codigo_lead(text, text, text) from public;
grant execute on function public.verificar_codigo_lead(text, text, text) to anon, authenticated, service_role;

-- Enlace personal del trámite (lo usan los correos al cliente y "enviarme mi enlace")
create or replace function public._lead_tramite_link(v_lead leads)
 returns text
 language plpgsql
 immutable
as $function$
declare
  v_tipo text := case when v_lead.constitucion = 'Persona Moral' then 'moral'
                      when v_lead.constitucion = 'Persona Física (asalariado)' then 'asalariado'
                      else 'fisica' end;
  v_first_name text := split_part(coalesce(v_lead.nombre_completo, ''), ' ', 1);
begin
  if v_lead.evento = 'documentacion_directa' then
    return 'https://firma7.com/documentacion?leadId=' || v_lead.id::text || '&tipo=' || v_tipo
      || (case when v_lead.producto = 'automotriz' then '&producto=automotriz' else '' end);
  else
    return 'https://firma7.com/aprobado?leadId=' || v_lead.id::text || '&tipo=' || v_tipo
      || (case when v_first_name <> '' then '&nombre=' || v_first_name else '' end);
  end if;
end;
$function$;

-- Progreso: ahora también dice de qué producto y tipo de persona es el trámite
create or replace function public.get_lead_progreso(p_lead_id uuid)
 returns jsonb
 language sql
 security definer
 set search_path to 'public'
as $function$
  select jsonb_build_object(
    'documentos', coalesce((
      select jsonb_agg(jsonb_build_object('tipoDocumento', tipo_documento, 'slotIndex', slot_index, 'fileName', file_name, 'purgado', purgado_at is not null))
      from public.lead_documentos where lead_id = p_lead_id
    ), '[]'::jsonb),
    'accionistas', coalesce((
      select jsonb_agg(jsonb_build_object(
        'slotIndex', slot_index, 'nombre', nombre, 'porcentaje', porcentaje,
        'esRepresentanteLegal', es_representante_legal, 'esMayoritario', es_mayoritario, 'correo', correo, 'telefono', telefono
      ) order by slot_index)
      from public.lead_accionistas where lead_id = p_lead_id
    ), '[]'::jsonb),
    'bancos', coalesce((
      select jsonb_agg(jsonb_build_object('slotIndex', slot_index, 'nombreBanco', nombre_banco) order by slot_index)
      from public.lead_bancos where lead_id = p_lead_id
    ), '[]'::jsonb),
    'ciecGuardada', exists(select 1 from public.leads where id = p_lead_id and (ciec_encrypted is not null or ciec_purgada_at is not null)),
    'expirado', exists(select 1 from public.lead_documentos where lead_id = p_lead_id and purgado_at is not null)
                or exists(select 1 from public.leads where id = p_lead_id and ciec_purgada_at is not null),
    'domicilioFiscalDistinto', coalesce((select domicilio_fiscal_distinto from public.leads where id = p_lead_id), false),
    'producto', coalesce((select producto from public.leads where id = p_lead_id), 'empresarial'),
    'constitucion', (select constitucion from public.leads where id = p_lead_id),
    'primerNombre', (select nullif(split_part(trim(nombre_completo), ' ', 1), '') from public.leads where id = p_lead_id),
    'contactoPreferido', (select contacto_preferido from public.leads where id = p_lead_id),
    'contactoHorario', (select contacto_horario from public.leads where id = p_lead_id)
  );
$function$;

-- Resumen de obligatorios / faltantes (lo usa el correo al equipo)
create or replace function public._lead_resumen_documentos(p_lead_id uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_const text;
  v_moral boolean;
  v_distinto boolean;
  v_pasos boolean;
  v_auto boolean;
  v_meses int;
  v_n_acc int;
  v_total int;
  v_subidos int;
  v_faltan text[];
begin
  select constitucion, coalesce(domicilio_fiscal_distinto, false), coalesce(producto, 'empresarial') = 'automotriz'
    into v_const, v_distinto, v_auto
    from public.leads where id = p_lead_id;
  v_moral := coalesce(v_const = 'Persona Moral', false);
  select coalesce((select docs_por_pasos_activo from public.site_config limit 1), false) into v_pasos;

  create temporary table if not exists _exp_docs (tipo text, slot int, etiqueta text) on commit drop;
  truncate _exp_docs;

  if v_auto then
    -- Crédito automotriz: listas cortas y 3 estados de cuenta
    v_meses := 3;
    if v_moral then
      insert into _exp_docs values
        ('ine_accionista', 1, 'INE del principal accionista — frente'),
        ('ine_accionista', 101, 'INE del principal accionista — reverso'),
        ('constancia_situacion_fiscal_accionista', 1, 'Constancia fiscal del principal accionista'),
        ('comprobante_domicilio_accionista', 1, 'Comprobante de domicilio del principal accionista'),
        ('acta_constitutiva', 1, 'Acta constitutiva'),
        ('comprobante_domicilio_operativo', 1, 'Comprobante de domicilio operativo'),
        ('constancia_situacion_fiscal', 1, 'Constancia de situación fiscal de la empresa');
    else
      insert into _exp_docs values
        ('ine', 1, 'INE — frente'),
        ('ine', 2, 'INE — reverso'),
        ('comprobante_domicilio_particular', 1, 'Comprobante de domicilio');
      if v_const = 'Persona Física con Actividad Empresarial' then
        insert into _exp_docs values ('constancia_situacion_fiscal', 1, 'Constancia de situación fiscal');
      end if;
    end if;
  else
    v_meses := 6;
    insert into _exp_docs values
      ('constancia_situacion_fiscal', 1, 'Constancia de situación fiscal'),
      ('declaracion_anual', 1, public._document_label('declaracion_anual', 1));

    if v_pasos then
      insert into _exp_docs values
        ('acuse_declaracion_anual', 1, public._document_label('acuse_declaracion_anual', 1)),
        ('comprobante_domicilio_operativo', 1, 'Comprobante de domicilio operativo');
      if v_distinto then
        insert into _exp_docs values ('comprobante_domicilio_fiscal', 1, 'Comprobante de domicilio fiscal');
      end if;
    else
      insert into _exp_docs values ('comprobante_domicilio_fiscal', 1, 'Comprobante de domicilio fiscal');
    end if;

    if v_moral then
      insert into _exp_docs values ('acta_constitutiva', 1, 'Acta constitutiva');
      if not v_pasos then
        insert into _exp_docs values ('comprobante_domicilio_operativo', 1, 'Comprobante de domicilio operativo');
      end if;
      select count(*) into v_n_acc from public.lead_accionistas where lead_id = p_lead_id;
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
  end if;

  -- Estados de cuenta: v_meses por cada banco que el cliente usó (con nombre guardado o con archivos subidos).
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
  cross join generate_series(1, v_meses) as m;

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

-- Correo al equipo (send_lead_documentos_email): indica el producto y, en automotriz, omite buró y CIEC (no aplican)
do $parche$
declare
  d text;
begin
  select pg_get_functiondef(p.oid) into d from pg_proc p where p.proname = 'send_lead_documentos_email' and p.pronamespace = 'public'::regnamespace;
  if d is null then raise exception 'no existe send_lead_documentos_email'; end if;
  if position('v_es_auto' in d) > 0 then
    raise notice 'send_lead_documentos_email ya estaba parchada para automotriz';
  else
    d := replace(d, E'  v_es_completo boolean;\nbegin', E'  v_es_completo boolean;\n  v_es_auto boolean;\nbegin');
    d := replace(d,
      E'  v_resumen := public._lead_resumen_documentos(p_lead_id);\n  v_es_completo :=',
      E'  v_es_auto := coalesce(v_lead.producto, ''empresarial'') = ''automotriz'';\n  v_resumen := public._lead_resumen_documentos(p_lead_id);\n  v_es_completo :=');
    d := replace(d,
      $q$|| public._team_section('Buró de crédito', v_buro_rows)$q$,
      $q$|| case when v_es_auto then '' else public._team_section('Buró de crédito', v_buro_rows) end$q$);
    d := replace(d,
      $q$|| public._team_section('Acceso SAT',$q$,
      $q$|| case when v_es_auto then '' else public._team_section('Acceso SAT',$q$);
    d := replace(d,
      $q$No capturada</span>' end))$q$,
      $q$No capturada</span>' end)) end$q$);
    d := replace(d,
      $q$|| public._team_row('Cargo', public._esc(v_lead.cargo))$q$,
      $q$|| public._team_row('Cargo', public._esc(v_lead.cargo))
        || public._team_row('Producto', case when v_es_auto then 'Crédito automotriz' else null end)$q$);
    d := replace(d,
      E'  v_html := public._team_email_shell(\n    v_color, v_kicker,',
      E'  if v_es_auto then v_kicker := v_kicker || '' · Crédito automotriz''; end if;\n  v_html := public._team_email_shell(\n    v_color, v_kicker,');
    if position('v_es_auto boolean' in d) = 0 or position('v_es_auto := ' in d) = 0
       or position('case when v_es_auto then '''' else public._team_section(''Buró' in d) = 0
       or position('case when v_es_auto then '''' else public._team_section(''Acceso SAT''' in d) = 0
       or position('No capturada</span>'' end)) end' in d) = 0
       or position('''Producto'', case when v_es_auto' in d) = 0
       or position('v_kicker || '' · Crédito automotriz''' in d) = 0 then
      raise exception 'el parche de send_lead_documentos_email (automotriz) no se aplicó completo';
    end if;
    execute d;
  end if;

  -- Aviso "Entró a subir documentos"
  select pg_get_functiondef(p.oid) into d from pg_proc p where p.proname = '_avisar_registro_documentacion' and p.pronamespace = 'public'::regnamespace;
  if d is null then raise exception 'no existe _avisar_registro_documentacion'; end if;
  if position('Crédito automotriz' in d) = 0 then
    d := replace(d,
      $q$|| public._team_row('Empresa', public._esc(v_lead.empresa));$q$,
      $q$|| public._team_row('Empresa', public._esc(v_lead.empresa))
    || public._team_row('Producto', case when coalesce(v_lead.producto, 'empresarial') = 'automotriz' then 'Crédito automotriz' else null end);$q$);
    d := replace(d,
      $q$'Nuevo lead',$q$,
      $q$'Nuevo lead' || case when coalesce(v_lead.producto, 'empresarial') = 'automotriz' then ' · Crédito automotriz' else '' end,$q$);
    if position('Crédito automotriz' in d) = 0 then raise exception 'el parche de _avisar_registro_documentacion no se aplicó'; end if;
    execute d;
  end if;
end
$parche$;

-- Ajuste (2026-10-31): en automotriz persona moral el nombre del principal accionista es dato obligatorio
-- (se guarda como accionista 1, mayoritario y representante legal): cuenta en el resumen de faltantes y aparece en el correo al equipo.
-- Aplicado con DO + replace sobre _lead_resumen_documentos (antes del `return`) y send_lead_documentos_email (fila "Principal accionista" tras "Producto").
