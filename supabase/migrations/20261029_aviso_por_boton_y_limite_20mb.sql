-- 2026-10-29 · Decisión de Santiago: el aviso de "documentación completa" NO es automático; el cliente vuelve, carga lo que falta y pulsa
-- "Enviar a mi asesor". Para guardar a medias existe el botón "Guardar y cargar el resto después" (manda el aviso de "enviada, faltan documentos").
--  1) Se quita el revisor automático (cron cada 5 min) creado el 2026-10-28.
--  2) El aviso de "faltan documentos" se puede repetir si el cliente subió documentos nuevos desde el último aviso.
--  3) Archivos de hasta 20 MB (actas y estados de cuenta; el resto sigue en 10 MB, validado en la página).

select cron.unschedule('revisar-expedientes-completos') where exists (select 1 from cron.job where jobname = 'revisar-expedientes-completos');
drop function if exists public.revisar_expedientes_completos();

alter table public.leads add column if not exists documentos_ultimo_aviso_at timestamptz;

do $parche$
declare
  d text;
  procedure_name constant text := 'send_lead_documentos_email';
begin
  select pg_get_functiondef(p.oid) into d from pg_proc p where p.proname = procedure_name and p.pronamespace = 'public'::regnamespace;
  if d is null then raise exception 'no existe %', procedure_name; end if;
  if position('documentos_ultimo_aviso_at' in d) > 0 then
    raise notice 'send_lead_documentos_email ya estaba parchada';
    return;
  end if;

  d := replace(d,
    $q$  if p_kind = 'completo' and v_lead.documentos_email_enviado
     and (not v_es_completo or v_lead.expediente_completo_notificado_at is not null) then
    return jsonb_build_object('sent', false, 'reason', 'already_sent');
  end if;$q$,
    $q$  if p_kind = 'completo' and v_lead.documentos_email_enviado then
    -- Ya se avisó "completo": no se repite. Si se avisó incompleto, solo se repite cuando hay documentos nuevos desde ese aviso.
    if v_lead.expediente_completo_notificado_at is not null then
      return jsonb_build_object('sent', false, 'reason', 'already_sent');
    end if;
    if not v_es_completo and not exists (
      select 1 from public.lead_documentos d2
      where d2.lead_id = p_lead_id and d2.created_at > coalesce(v_lead.documentos_ultimo_aviso_at, '-infinity'::timestamptz)
    ) then
      return jsonb_build_object('sent', false, 'reason', 'already_sent');
    end if;
  end if;$q$);

  d := replace(d,
    'expediente_completo_notificado_at = now(), documentos_incompleto_email_enviado = true where id = p_lead_id;',
    'expediente_completo_notificado_at = now(), documentos_ultimo_aviso_at = now(), documentos_incompleto_email_enviado = true where id = p_lead_id;');
  d := replace(d,
    'set documentos_email_enviado = true, documentos_incompleto_email_enviado = true where id = p_lead_id;',
    'set documentos_email_enviado = true, documentos_ultimo_aviso_at = now(), documentos_incompleto_email_enviado = true where id = p_lead_id;');
  d := replace(d,
    'Cuando los suba y el expediente quede completo, recibirás otro correo.',
    'Cuando termine de cargarlos y pulse "Enviar a mi asesor", recibirás otro correo.');

  if position('v_lead.documentos_ultimo_aviso_at' in d) = 0 or position('documentos_ultimo_aviso_at = now(), documentos_incompleto_email_enviado' in d) = 0
     or position('pulse "Enviar a mi asesor"' in d) = 0 then
    raise exception 'el parche de send_lead_documentos_email no se aplicó completo';
  end if;
  execute d;
end
$parche$;

update storage.buckets set file_size_limit = 20971520 where id = 'lead-documentos';

-- 4) También se quita el aviso automático "Lead incompleto" (a los 30 min). Quedan solo los avisos por acción del cliente:
--    entra a subir documentos (/documentacion), "Guardar y cargar el resto después" y "Enviar a mi asesor".
select cron.unschedule('revisar-leads-documentacion-incompleta') where exists (select 1 from cron.job where jobname = 'revisar-leads-documentacion-incompleta');
drop function if exists public.revisar_leads_documentacion_incompleta();
