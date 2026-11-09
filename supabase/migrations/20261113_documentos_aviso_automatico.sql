-- Aviso automático de documentos sin guardar.
--
-- Problema: si un cliente sube documentos y no pulsa "Guardar" / "Enviar a mi asesor" (cierra la app, se queda sin
-- señal, vuelve días después, etc.), el equipo no se entera. El correo "entró a subir documentos" solo sale la primera vez.
--
-- Solución: cada 10 minutos se buscan leads con documentos nuevos (posteriores al último aviso) y sin actividad
-- desde hace 30 minutos, y se manda UN correo al equipo con el avance (una vez por tanda de documentos).
--
-- 1) send_lead_documentos_email acepta p_kind = 'automatico': mismo correo de avance, con encabezado propio.
-- 2) notificar_documentos_sin_avisar(): recorre los leads pendientes y llama al paso 1.
-- 3) Tarea programada cada 10 minutos.

do $parche$
declare
  v_def text;
  v_new text;
begin
  v_def := pg_get_functiondef('public.send_lead_documentos_email(uuid,text)'::regprocedure);
  v_new := v_def;

  -- Variable y validación del nuevo tipo
  v_new := replace(v_new,
    $r$  v_es_auto boolean;
begin
  if p_kind not in ('completo', 'incompleto') then$r$,
    $r$  v_es_auto boolean;
  v_auto boolean := false;
begin
  if p_kind = 'automatico' then
    v_auto := true;
    p_kind := 'completo';
  end if;
  if p_kind not in ('completo', 'incompleto') then$r$);

  -- Encabezado del correo automático (cuando faltan documentos)
  v_new := replace(v_new,
    $r$  if p_kind = 'completo' and not v_es_completo then
    v_color := '#b45309';$r$,
    $r$  if v_auto and not v_es_completo then
    v_color := '#475569';
    v_kicker := 'Documentos sin guardar · aviso automático';
    v_title := coalesce(public._esc(v_lead.nombre_completo), 'El lead') || ' subió documentos pero no pulsó "Guardar"';
    v_sub := 'Pasaron 30 minutos sin actividad. Este es su avance hasta ahora.';
    v_after := public._team_nota('#f1f5f9', '#475569', '#334155', '<strong>Acción sugerida:</strong> contactar al lead para ayudarlo a terminar de subir lo que falta. Cuando guarde o pulse "Enviar a mi asesor", recibirás otro correo.');
  elsif p_kind = 'completo' and not v_es_completo then
    v_color := '#b45309';$r$);

  -- Asunto del correo automático
  v_new := replace(v_new,
    $r$when p_kind='completo' then '📤$r$,
    $r$when v_auto and not v_es_completo then '📥 Subió documentos sin guardar (' || v_subidos || '/' || v_total || ') — ' || coalesce(v_lead.nombre_completo, '')
                      when p_kind='completo' then '📤$r$);

  if v_new = v_def
     or position('v_auto and not v_es_completo then' in v_new) = 0
     or position('p_kind = ''automatico''' in v_new) = 0
     or position('Documentos sin guardar · aviso automático' in v_new) = 0 then
    raise exception 'No se aplicó el parche de send_lead_documentos_email (el texto original cambió)';
  end if;

  execute v_new;
end
$parche$;

create or replace function public.notificar_documentos_sin_avisar(p_solo_lead uuid default null)
returns integer
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $fn$
declare
  r record;
  v_res jsonb;
  v_n integer := 0;
begin
  for r in
    select l.id
    from public.leads l
    where l.expediente_completo_notificado_at is null
      and (p_solo_lead is null or l.id = p_solo_lead)
      and exists (
        select 1 from public.lead_documentos d
        where d.lead_id = l.id and d.purgado_at is null
          and d.created_at > coalesce(l.documentos_ultimo_aviso_at, '-infinity'::timestamptz)
      )
      -- sin actividad desde hace 30 minutos, y actividad reciente (últimos 3 días)
      and (select max(d.created_at) from public.lead_documentos d where d.lead_id = l.id) < now() - interval '30 minutes'
      and (select max(d.created_at) from public.lead_documentos d where d.lead_id = l.id) > now() - interval '3 days'
    order by l.created_at
    limit 20
  loop
    begin
      v_res := public.send_lead_documentos_email(r.id, 'automatico');
      if coalesce((v_res ->> 'sent')::boolean, false) then v_n := v_n + 1; end if;
    exception when others then
      raise warning 'notificar_documentos_sin_avisar (lead %): %', r.id, sqlerrm;
    end;
  end loop;
  return v_n;
end;
$fn$;

revoke all on function public.notificar_documentos_sin_avisar(uuid) from public, anon, authenticated;

-- Tarea programada (cada 10 minutos) — YA aplicada el 2026-11-09 tras probar la función:
-- select cron.schedule('notificar-documentos-sin-avisar', '*/10 * * * *', 'select public.notificar_documentos_sin_avisar();');
