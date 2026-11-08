-- 2026-11-10 · Etiquetas de GHL por producto
-- Lead de la página web: "Lead Pagina Web - Automotriz" (crédito automotriz) o "Lead Pagina Web - Empresarial" (crédito empresarial).
-- Se quita la etiqueta suelta 'credito-automotriz' (ya la cubre la nueva). Los de alianza_directa conservan 'lead-alianza'.
do $parche$
declare d text;
begin
  select pg_get_functiondef(p.oid) into d from pg_proc p where p.proname = 'sync_lead_to_ghl' and p.pronamespace = 'public'::regnamespace;
  if position('Lead Pagina Web - ' in d) = 0 then
    d := replace(d,
      $q$case when new.evento = 'alianza_directa' then 'lead-alianza' else 'Lead Pagina web' end,$q$,
      $q$case when new.evento = 'alianza_directa' then 'lead-alianza'
           when new.producto = 'automotriz' then 'Lead Pagina Web - Automotriz'
           else 'Lead Pagina Web - Empresarial' end,$q$);
    d := replace(d,
      $q$    if new.producto = 'automotriz' then
      v_tags := v_tags || jsonb_build_array('credito-automotriz');
    end if;
$q$, '');
    if position('Lead Pagina Web - Automotriz' in d) = 0 or position('credito-automotriz' in d) > 0 then
      raise exception 'parche sync_lead_to_ghl incompleto';
    end if;
    execute d;
  end if;
end
$parche$;
