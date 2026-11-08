-- 2026-11-09 · Landing y perfilador de crédito automotriz (/credito-automotriz)
-- El formulario de la landing guarda el lead con estos datos y decide: buró "Bueno" → sigue a subir documentos (/aprobado);
-- buró "Regular" o "Malo" → descarte (único criterio de descarte).

alter table public.leads add column if not exists ciudad text;
alter table public.leads add column if not exists enganche text;
alter table public.leads add column if not exists tiene_vehiculo boolean;
alter table public.leads add column if not exists vehiculo_marca text;
alter table public.leads add column if not exists vehiculo_modelo text;
alter table public.leads add column if not exists vehiculo_anio text;
alter table public.leads add column if not exists vehiculo_origen text;
alter table public.leads drop constraint if exists leads_vehiculo_origen_check;
alter table public.leads add constraint leads_vehiculo_origen_check check (vehiculo_origen is null or vehiculo_origen in ('Lote', 'Particular', 'Agencia'));

create or replace function public.submit_lead_automotriz(p jsonb)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_id uuid;
  v_correo text := lower(trim(p->>'correo'));
  v_tipo text := p->>'tipoPersona';
  v_const text;
  v_buro text := p->>'buro';
  v_calificado boolean;
  v_tel text := regexp_replace(coalesce(p->>'numero', ''), '[^0-9]', '', 'g');
  v_tiene boolean := coalesce((p->>'tieneVehiculo')::boolean, false);
  v_evento text;
begin
  if v_tipo not in ('asalariado', 'fisica', 'moral') then raise exception 'tipo de persona invalido'; end if;
  if v_buro not in ('Bueno', 'Regular', 'Malo') then raise exception 'buro invalido'; end if;
  if coalesce(trim(p->>'nombreCompleto'), '') = '' then raise exception 'Falta el nombre'; end if;
  if length(v_tel) <> 10 then raise exception 'Telefono invalido'; end if;
  if v_correo = '' or position('@' in v_correo) = 0 then raise exception 'Correo invalido'; end if;
  if coalesce(trim(p->>'ciudad'), '') = '' then raise exception 'Falta la ciudad'; end if;
  if v_tiene then
    if coalesce(trim(p->>'vehiculoMarca'), '') = '' or coalesce(trim(p->>'vehiculoModelo'), '') = ''
       or coalesce(trim(p->>'vehiculoAnio'), '') = '' or (p->>'vehiculoOrigen') not in ('Lote', 'Particular', 'Agencia') then
      raise exception 'Faltan los datos del vehiculo';
    end if;
  end if;

  v_const := case v_tipo
    when 'moral' then 'Persona Moral'
    when 'asalariado' then 'Persona Física (asalariado)'
    else 'Persona Física con Actividad Empresarial' end;
  v_calificado := (v_buro = 'Bueno');
  v_evento := case when v_calificado then 'lead_calificado' else 'lead_descartado' end;

  select id into v_id
  from public.leads
  where lower(trim(correo)) = v_correo and producto = 'automotriz'
  order by created_at desc
  limit 1;

  if v_id is not null then
    update public.leads set
      nombre_completo = trim(p->>'nombreCompleto'),
      numero = v_tel,
      correo = trim(p->>'correo'),
      constitucion = v_const,
      ingresos = nullif(trim(p->>'ingresos'), ''),
      buro_pf = v_buro,
      destino = 'Crédito automotriz',
      calificado = v_calificado,
      evento = v_evento,
      ciudad = trim(p->>'ciudad'),
      enganche = nullif(trim(p->>'enganche'), ''),
      tiene_vehiculo = v_tiene,
      vehiculo_marca = case when v_tiene then trim(p->>'vehiculoMarca') end,
      vehiculo_modelo = case when v_tiene then trim(p->>'vehiculoModelo') end,
      vehiculo_anio = case when v_tiene then trim(p->>'vehiculoAnio') end,
      vehiculo_origen = case when v_tiene then p->>'vehiculoOrigen' end,
      utm_source = coalesce(nullif(p->>'utmSource', ''), utm_source),
      utm_medium = coalesce(nullif(p->>'utmMedium', ''), utm_medium),
      utm_campaign = coalesce(nullif(p->>'utmCampaign', ''), utm_campaign),
      utm_content = coalesce(nullif(p->>'utmContent', ''), utm_content),
      updated_at = now()
    where id = v_id;
  else
    insert into public.leads (
      nombre_completo, numero, correo, constitucion, ingresos, buro_pf, destino, calificado, evento, producto,
      ciudad, enganche, tiene_vehiculo, vehiculo_marca, vehiculo_modelo, vehiculo_anio, vehiculo_origen,
      utm_source, utm_medium, utm_campaign, utm_content
    ) values (
      trim(p->>'nombreCompleto'), v_tel, trim(p->>'correo'), v_const, nullif(trim(p->>'ingresos'), ''), v_buro,
      'Crédito automotriz', v_calificado, v_evento, 'automotriz',
      trim(p->>'ciudad'), nullif(trim(p->>'enganche'), ''), v_tiene,
      case when v_tiene then trim(p->>'vehiculoMarca') end, case when v_tiene then trim(p->>'vehiculoModelo') end,
      case when v_tiene then trim(p->>'vehiculoAnio') end, case when v_tiene then p->>'vehiculoOrigen' end,
      nullif(p->>'utmSource', ''), nullif(p->>'utmMedium', ''), nullif(p->>'utmCampaign', ''), nullif(p->>'utmContent', '')
    ) returning id into v_id;
  end if;

  return jsonb_build_object('leadId', v_id, 'calificado', v_calificado, 'tipo', v_tipo);
end;
$function$;
revoke all on function public.submit_lead_automotriz(jsonb) from public;
grant execute on function public.submit_lead_automotriz(jsonb) to anon, authenticated, service_role;

-- Enlace personal del trámite: los leads automotriz que llegan del perfilador (/aprobado) también llevan su producto
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
  v_prod text := case when v_lead.producto = 'automotriz' then '&producto=automotriz' else '' end;
begin
  if v_lead.evento = 'documentacion_directa' then
    return 'https://firma7.com/documentacion?leadId=' || v_lead.id::text || '&tipo=' || v_tipo || v_prod;
  else
    return 'https://firma7.com/aprobado?leadId=' || v_lead.id::text || '&tipo=' || v_tipo || v_prod
      || (case when v_first_name <> '' then '&nombre=' || v_first_name else '' end);
  end if;
end;
$function$;

do $parche$
declare d text;
begin
  -- GHL: etiqueta "credito-automotriz", ciudad del contacto y buró del lead automotriz persona moral (se guarda en buro_pf)
  select pg_get_functiondef(p.oid) into d from pg_proc p where p.proname = 'sync_lead_to_ghl' and p.pronamespace = 'public'::regnamespace;
  if position('credito-automotriz' in d) = 0 then
    d := replace(d,
      $q$if new.constitucion = 'Persona Moral' then$q$,
      $q$if new.constitucion = 'Persona Moral' and coalesce(new.producto, 'empresarial') <> 'automotriz' then$q$);
    d := replace(d,
      $q$to_char(new.created_at at time zone 'America/Mexico_City', 'DD/MM/YYYY')
    );$q$,
      $q$to_char(new.created_at at time zone 'America/Mexico_City', 'DD/MM/YYYY')
    );
    if new.producto = 'automotriz' then
      v_tags := v_tags || jsonb_build_array('credito-automotriz');
    end if;$q$);
    d := replace(d,
      $q$'phone', v_phone,$q$,
      $q$'phone', v_phone,
      'city', nullif(new.ciudad, ''),$q$);
    if position('credito-automotriz' in d) = 0 or position('new.ciudad' in d) = 0 or position('<> ''automotriz'' then' in d) = 0 then
      raise exception 'parche sync_lead_to_ghl incompleto';
    end if;
    execute d;
  end if;

  -- El seguimiento a los 90 días de descartados habla de crédito empresarial: no se manda a los de automotriz
  select pg_get_functiondef(p.oid) into d from pg_proc p where p.proname = 'trigger_seguimiento_descarte' and p.pronamespace = 'public'::regnamespace;
  if position('coalesce(producto' in d) = 0 then
    d := replace(d, $q$and evento = 'lead_descartado'$q$, $q$and evento = 'lead_descartado'
      and coalesce(producto, 'empresarial') = 'empresarial'$q$);
    if position('coalesce(producto' in d) = 0 then raise exception 'parche seguimiento incompleto'; end if;
    execute d;
  end if;
end
$parche$;
