-- Documentación por pasos (2026-10-08)
-- - Nuevos tipos de documento: acta_asamblea (si aplica) y acuse_declaracion_anual (va aparte de la declaración).
-- - Domicilio operativo es el documento principal; el fiscal solo se pide si el cliente marca "mi domicilio operativo es distinto al fiscal".
-- - Accionistas: casillas "mayoritario" y "representante legal" (pueden ser la misma persona); suben documentos quienes tengan alguna casilla
--   (o el único accionista). El resto solo aporta nombre, %, correo y teléfono.

-- 1) Tipos de documento permitidos (tabla + política de subida al bucket)
alter table public.lead_documentos drop constraint if exists lead_documentos_tipo_documento_check;
alter table public.lead_documentos add constraint lead_documentos_tipo_documento_check check (tipo_documento = any (array[
  'constancia_situacion_fiscal','ine','declaracion_anual','acuse_declaracion_anual','estado_cuenta',
  'comprobante_domicilio_fiscal','comprobante_domicilio_particular','comprobante_domicilio_operativo',
  'acta_constitutiva','acta_asamblea','escrituras_modificaciones',
  'ine_accionista','comprobante_domicilio_accionista','constancia_situacion_fiscal_accionista','acta_matrimonio_accionista'
]));

alter policy "anon upload to own-shaped path" on storage.objects with check (
  bucket_id = 'lead-documentos'
  and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and (storage.foldername(name))[2] = any (array[
    'constancia_situacion_fiscal','ine','declaracion_anual','acuse_declaracion_anual','estado_cuenta',
    'comprobante_domicilio_fiscal','comprobante_domicilio_particular','comprobante_domicilio_operativo',
    'acta_constitutiva','acta_asamblea','escrituras_modificaciones',
    'ine_accionista','comprobante_domicilio_accionista','constancia_situacion_fiscal_accionista','acta_matrimonio_accionista'
  ])
);

-- 2) Columnas nuevas
alter table public.leads add column if not exists domicilio_fiscal_distinto boolean not null default false;
alter table public.lead_accionistas add column if not exists es_mayoritario boolean not null default false;
create unique index if not exists lead_accionistas_un_mayoritario on public.lead_accionistas (lead_id) where es_mayoritario;

-- 3) Etiquetas de documentos
create or replace function public._document_label(p_tipo text, p_slot integer)
 returns text
 language sql
 stable
 set search_path to 'public'
as $function$
  select case p_tipo
    when 'constancia_situacion_fiscal' then 'Constancia de situación fiscal'
    when 'ine' then case when p_slot >= 2 then 'INE — reverso' else 'INE — frente' end
    when 'declaracion_anual' then 'Declaración anual '
      || (extract(year from (now() at time zone 'America/Mexico_City'))::int
          - case when extract(month from (now() at time zone 'America/Mexico_City')) >= 4 then 1 else 2 end)
    when 'acuse_declaracion_anual' then 'Acuse electrónico de la declaración anual '
      || (extract(year from (now() at time zone 'America/Mexico_City'))::int
          - case when extract(month from (now() at time zone 'America/Mexico_City')) >= 4 then 1 else 2 end)
    when 'estado_cuenta' then 'Estado de cuenta — mes ' || (p_slot % 10)
    when 'comprobante_domicilio_fiscal' then 'Comprobante de domicilio fiscal'
    when 'comprobante_domicilio_particular' then 'Comprobante de domicilio particular'
    when 'comprobante_domicilio_operativo' then 'Comprobante de domicilio operativo'
    when 'acta_constitutiva' then 'Acta constitutiva'
    when 'acta_asamblea' then 'Última acta de asamblea'
    when 'escrituras_modificaciones' then 'Escrituras con modificaciones'
    when 'ine_accionista' then case when p_slot >= 100 then 'INE del accionista — reverso' else 'INE del accionista — frente' end
    when 'comprobante_domicilio_accionista' then 'Comprobante de domicilio del accionista'
    when 'constancia_situacion_fiscal_accionista' then 'Constancia de situación fiscal del accionista'
    when 'acta_matrimonio_accionista' then 'Acta de matrimonio del accionista'
    else p_tipo
  end;
$function$;

-- 4) Resumen de lo que falta (lo usa el correo al equipo)
create or replace function public._lead_resumen_documentos(p_lead_id uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_moral boolean;
  v_distinto boolean;
  v_n_acc int;
  v_total int;
  v_subidos int;
  v_faltan text[];
begin
  select coalesce(constitucion = 'Persona Moral', false), coalesce(domicilio_fiscal_distinto, false)
    into v_moral, v_distinto
    from public.leads where id = p_lead_id;

  create temporary table if not exists _exp_docs (tipo text, slot int, etiqueta text) on commit drop;
  truncate _exp_docs;

  insert into _exp_docs values
    ('constancia_situacion_fiscal', 1, 'Constancia de situación fiscal'),
    ('declaracion_anual', 1, public._document_label('declaracion_anual', 1)),
    ('acuse_declaracion_anual', 1, public._document_label('acuse_declaracion_anual', 1)),
    ('comprobante_domicilio_operativo', 1, 'Comprobante de domicilio operativo');

  if v_distinto then
    insert into _exp_docs values ('comprobante_domicilio_fiscal', 1, 'Comprobante de domicilio fiscal');
  end if;

  if v_moral then
    insert into _exp_docs values ('acta_constitutiva', 1, 'Acta constitutiva');
    select count(*) into v_n_acc from public.lead_accionistas where lead_id = p_lead_id;
    -- Accionista mayoritario y/o representante legal (o el único accionista): suben su identificación
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
      and (a.es_representante_legal or a.es_mayoritario or v_n_acc = 1);
  else
    insert into _exp_docs values
      ('ine', 1, 'INE — frente'),
      ('ine', 2, 'INE — reverso'),
      ('comprobante_domicilio_particular', 1, 'Comprobante de domicilio particular');
  end if;

  -- Estados de cuenta: 6 meses por banco (si aún no hay bancos capturados, se espera uno)
  insert into _exp_docs
  select 'estado_cuenta', b.slot * 10 + m,
         'Estado de cuenta ' || coalesce(nullif(b.nombre, ''), 'banco ' || b.slot) || ' — mes ' || m
  from (
    select slot_index::int as slot, nombre_banco as nombre from public.lead_bancos where lead_id = p_lead_id
    union all
    select 1, null where not exists (select 1 from public.lead_bancos where lead_id = p_lead_id)
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

-- 5) Progreso que ve el cliente al volver (ahora con mayoritario y domicilio fiscal distinto)
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
    'primerNombre', (select nullif(split_part(trim(nombre_completo), ' ', 1), '') from public.leads where id = p_lead_id),
    'contactoPreferido', (select contacto_preferido from public.leads where id = p_lead_id),
    'contactoHorario', (select contacto_horario from public.leads where id = p_lead_id)
  );
$function$;

-- 6) Accionistas: casilla de mayoritario (una sola por trámite, igual que la de representante legal)
drop function if exists public.upsert_lead_accionista(uuid, smallint, text, numeric, boolean, text, text);
create or replace function public.upsert_lead_accionista(
  p_lead_id uuid, p_slot_index smallint, p_nombre text, p_porcentaje numeric,
  p_es_representante_legal boolean default false, p_correo text default null, p_telefono text default null,
  p_es_mayoritario boolean default null)
 returns uuid
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_id uuid;
begin
  -- Al marcar a este como representante legal / mayoritario se desmarca a cualquier otro del mismo
  -- trámite (hay un índice único parcial por cada casilla). Una misma persona puede tener ambas.
  if p_es_representante_legal then
    update public.lead_accionistas set es_representante_legal = false
    where lead_id = p_lead_id and slot_index <> p_slot_index and es_representante_legal;
  end if;
  if coalesce(p_es_mayoritario, false) then
    update public.lead_accionistas set es_mayoritario = false
    where lead_id = p_lead_id and slot_index <> p_slot_index and es_mayoritario;
  end if;

  insert into public.lead_accionistas (lead_id, slot_index, nombre, porcentaje, es_representante_legal, es_mayoritario, correo, telefono)
  values (p_lead_id, p_slot_index, nullif(trim(p_nombre), ''), p_porcentaje, p_es_representante_legal, coalesce(p_es_mayoritario, false),
          nullif(trim(coalesce(p_correo, '')), ''), nullif(trim(coalesce(p_telefono, '')), ''))
  on conflict (lead_id, slot_index) do update set
    nombre = nullif(trim(excluded.nombre), ''),
    porcentaje = excluded.porcentaje,
    es_representante_legal = excluded.es_representante_legal,
    es_mayoritario = coalesce(p_es_mayoritario, public.lead_accionistas.es_mayoritario),
    correo = nullif(trim(coalesce(excluded.correo, '')), ''),
    telefono = nullif(trim(coalesce(excluded.telefono, '')), ''),
    updated_at = now()
  returning id into v_id;
  return v_id;
end;
$function$;
revoke all on function public.upsert_lead_accionista(uuid, smallint, text, numeric, boolean, text, text, boolean) from public;
grant execute on function public.upsert_lead_accionista(uuid, smallint, text, numeric, boolean, text, text, boolean) to anon, authenticated, service_role;

-- 7) "Mi domicilio operativo es distinto al fiscal"
create or replace function public.guardar_domicilio_fiscal_distinto(p_lead_id uuid, p_distinto boolean)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  update public.leads set domicilio_fiscal_distinto = coalesce(p_distinto, false) where id = p_lead_id;
end;
$function$;
revoke all on function public.guardar_domicilio_fiscal_distinto(uuid, boolean) from public;
grant execute on function public.guardar_domicilio_fiscal_distinto(uuid, boolean) to anon, authenticated, service_role;

-- 8) Correo al equipo: los documentos de accionistas llevan el nombre de la persona (ahora pueden ser dos: mayoritario y representante legal).
-- Se aplicó parchando send_lead_documentos_email: tras `v_label := public._document_label(d.tipo_documento, d.slot_index);` se agrega
--   if d.tipo_documento in ('ine_accionista','comprobante_domicilio_accionista','constancia_situacion_fiscal_accionista','acta_matrimonio_accionista') then
--     select nombre into v_banco from public.lead_accionistas
--      where lead_id = p_lead_id and slot_index = case when d.slot_index >= 100 then d.slot_index - 100 else d.slot_index end;
--     if nullif(v_banco, '') is not null then v_label := v_label || ' (' || v_banco || ')'; end if;
--   end if;
-- (Si se regenera el snapshot de funciones, ya incluirá este cambio.)
