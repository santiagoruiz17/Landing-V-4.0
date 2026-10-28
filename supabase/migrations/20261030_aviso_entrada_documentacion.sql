-- 2026-10-30 · El aviso "Entró a subir documentos" aplica igual para quien llega del pre-calificador (/aprobado) que para quien entra por la
-- liga de documentos que compartimos (/documentacion). La página llama a esta función al abrir el formulario; solo avisa una vez por lead.

create or replace function public.avisar_entrada_documentacion(p_lead_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  -- Si la página lo pide dos veces a la vez (p. ej. recarga rápida), la segunda espera y ya encuentra el aviso marcado como enviado.
  perform pg_advisory_xact_lock(hashtext('aviso_entrada_' || p_lead_id::text));
  perform public._avisar_registro_documentacion(p_lead_id);
end;
$function$;
revoke all on function public.avisar_entrada_documentacion(uuid) from public;
grant execute on function public.avisar_entrada_documentacion(uuid) to anon, authenticated, service_role;

-- El texto del aviso ya no habla de los "30 minutos" (ese aviso automático se quitó).
do $parche$
declare
  d text;
begin
  select pg_get_functiondef(p.oid) into d from pg_proc p where p.proname = '_avisar_registro_documentacion' and p.pronamespace = 'public'::regnamespace;
  if d is null then raise exception 'no existe _avisar_registro_documentacion'; end if;
  d := replace(d,
    'Recibirás otro correo con su documentación cuando la termine de subir, o a los 30 minutos si se queda a medias.',
    'Recibirás otro correo cuando guarde su avance o pulse "Enviar a mi asesor".');
  if position('pulse "Enviar a mi asesor"' in d) = 0 then raise exception 'el parche del texto no se aplicó'; end if;
  execute d;
end
$parche$;
