-- ============================================================================
-- Firma 7 — Instantánea del estado final de la sesión del 2026-10-04/05
-- Documentación de leads de Facebook (/documentacion), /gracias (opinión,
-- referidos, testimonios) y correos internos.
--
-- Esto es una INSTANTÁNEA generada desde la base de producción (proyecto
-- pkfnmpdlrbpnlerttoaz), no una migración incremental: las migraciones
-- originales viven en el historial de Supabase (versiones 20261005…). Sirve de
-- respaldo y de referencia de cómo quedó cada función. Es idempotente en lo
-- posible (CREATE OR REPLACE / IF NOT EXISTS), pero revísala antes de
-- ejecutarla sobre otra base.
--
-- Pendiente de decisión (ver memoria del proyecto):
--  * Los correos internos se envían solo a saruiz@socasesores.com mientras duran
--    las pruebas (original: to omruiz@socasesores.com, cc saruiz@).
--  * site_config.correos_cliente_activos = false: los correos al cliente de
--    "recibimos tu documentación" / "te faltan documentos" los envía GHL.
-- ============================================================================


-- ─── 1. Esquema: columnas, tablas, índices, RLS, trigger ────────────────────

-- leads
alter table public.leads add column if not exists ciec_guardada_at timestamptz;
alter table public.leads add column if not exists ciec_purgada_at timestamptz;
alter table public.leads add column if not exists aviso_registro_enviado boolean not null default false;
alter table public.leads add column if not exists contacto_preferido text;
alter table public.leads add column if not exists contacto_horario text;

-- lead_documentos: el archivo se borra a los 7 días, el registro se conserva
alter table public.lead_documentos add column if not exists purgado_at timestamptz;

-- site_config: interruptor de correos al cliente (apagado: los manda GHL)
alter table public.site_config add column if not exists correos_cliente_activos boolean not null default false;

-- Código de acceso por correo para retomar un avance
create table if not exists public.lead_codigos_acceso (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  codigo_hash text not null,
  expires_at timestamptz not null,
  intentos smallint not null default 0,
  usado boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_lead_codigos_acceso_lead on public.lead_codigos_acceso (lead_id, created_at desc);
alter table public.lead_codigos_acceso enable row level security;  -- sin políticas: solo vía RPC security definer

-- referidos_clientes (opinión + referidos de /gracias)
alter table public.referidos_clientes alter column referido_1_empresa drop not null;
alter table public.referidos_clientes alter column referido_1_contacto drop not null;
alter table public.referidos_clientes alter column referido_1_correo drop not null;
alter table public.referidos_clientes alter column referido_1_telefono drop not null;
alter table public.referidos_clientes add column if not exists referido_por_telefono text;
alter table public.referidos_clientes add column if not exists calificacion smallint check (calificacion between 1 and 5);
alter table public.referidos_clientes add column if not exists autoriza_publicar boolean not null default false;
alter table public.referidos_clientes add column if not exists finalizado_at timestamptz;
alter table public.referidos_clientes add column if not exists aviso_opinion_enviado boolean not null default false;
alter table public.referidos_clientes add column if not exists aviso_referidos_enviado boolean not null default false;

-- Referidos nuevos: hasta 7, con tipo de crédito
create table if not exists public.referidos_gracias_items (
  id uuid primary key default gen_random_uuid(),
  envio_id uuid not null references public.referidos_clientes(id) on delete cascade,
  orden smallint not null,
  nombre text not null,
  telefono text not null,
  correo text,
  empresa text,
  tipo_credito text not null check (tipo_credito in ('automotriz', 'hipotecario', 'empresarial')),
  created_at timestamptz not null default now(),
  unique (envio_id, orden)
);
alter table public.referidos_gracias_items enable row level security;  -- sin políticas: solo vía RPC

-- testimonios: estrellas, consentimiento y enlace secreto para publicar desde el correo
alter table public.testimonios add column if not exists calificacion smallint check (calificacion between 1 and 5);
alter table public.testimonios add column if not exists lead_id uuid references public.leads(id) on delete set null;
alter table public.testimonios add column if not exists autoriza_publicar boolean not null default true;
alter table public.testimonios add column if not exists aprobar_token uuid not null default gen_random_uuid();
create unique index if not exists testimonios_lead_id_key on public.testimonios (lead_id) where lead_id is not null;
create unique index if not exists testimonios_referido_id_key on public.testimonios (referido_id) where referido_id is not null;
create unique index if not exists testimonios_aprobar_token_key on public.testimonios (aprobar_token);

-- Landings de alianzas (enlaces de oficina; las URLs son datos y no se guardan aquí)
create table if not exists public.alianza_enlaces (
  slug text primary key,
  nombre text not null,
  url_inicio text,
  activo boolean not null default true,
  orden int not null default 100,
  created_at timestamptz not null default now()
);
alter table public.alianza_enlaces enable row level security;  -- sin políticas: solo vía RPC security definer
insert into public.alianza_enlaces (slug, nombre, orden) values
  ('konfio', 'Konfío', 1), ('creze', 'Fondeadora', 2), ('hay-cash', 'Hay Cash', 3), ('xepelin', 'Xepelin', 4),
  ('finsus', 'Finsus', 5), ('covalto', 'Covalto', 6), ('finbe-abc', 'FinBe ABC', 7)
on conflict (slug) do nothing;
alter table public.leads add column if not exists alianza_origen text;
alter table public.leads add column if not exists alianza_enlace_entregado_at timestamptz;
alter table public.leads add column if not exists contacto_autorizado_at timestamptz;

-- El trigger se crea DESPUÉS de las funciones (sección 2)


-- ─── 2. Funciones (definiciones tal como están en producción) ───────────────

CREATE OR REPLACE FUNCTION public._avisar_opinion_gracias(p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_mail jsonb;
begin
  if exists (select 1 from public.referidos_clientes where id = p_id and aviso_opinion_enviado) then return; end if;
  v_mail := public._correo_opinion_gracias(p_id);
  if v_mail is null then return; end if;
  if public._enviar_correo_equipo(v_mail->>'subject', v_mail->>'html') then
    update public.referidos_clientes set aviso_opinion_enviado = true where id = p_id;
  end if;
exception when others then
  raise warning '_avisar_opinion_gracias: %', sqlerrm;
end;
$function$
;

CREATE OR REPLACE FUNCTION public._avisar_referidos_gracias(p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_mail jsonb;
begin
  if exists (select 1 from public.referidos_clientes where id = p_id and aviso_referidos_enviado) then return; end if;
  v_mail := public._correo_referidos_gracias(p_id);
  if v_mail is null then return; end if;
  if public._enviar_correo_equipo(v_mail->>'subject', v_mail->>'html') then
    update public.referidos_clientes set aviso_referidos_enviado = true where id = p_id;
  end if;
exception when others then
  raise warning '_avisar_referidos_gracias: %', sqlerrm;
end;
$function$
;

CREATE OR REPLACE FUNCTION public._avisar_registro_alianza(p_lead uuid, p_alianza text, p_enlace boolean, p_existente boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  r record; v_content text; v_html text;
begin
  select * into r from public.leads where id = p_lead;
  if not found then return; end if;

  v_content := public._team_section('Datos del contacto',
        public._team_row('Nombre', public._esc(r.nombre_completo))
     || public._team_row('Teléfono', public._esc(r.numero))
     || public._team_row('Correo', public._esc(r.correo)))
   || public._team_section('Origen',
        public._team_row('Alianza', public._esc(p_alianza))
     || public._team_row('Lead', case when p_existente then 'Ya estaba registrado (se actualizó su origen)' else 'Nuevo' end)
     || public._team_row('Plataforma de la alianza', case when p_enlace then 'Se le abrió su enlace para continuar ✅' else '<span style="color:#b45309">Aún no hay enlace configurado: no se le pudo abrir la plataforma</span>' end)
     || public._team_row('Campaña', public._esc(coalesce(r.utm_campaign, r.utm_source))));

  v_html := public._team_email_shell(
    '#006d4e', 'Nuevo lead de alianza', public._esc(r.nombre_completo),
    'Quiere iniciar su solicitud con ' || public._esc(p_alianza) || '.',
    public._team_acciones(r.numero), v_content,
    public._team_nota('#f0faf5', '#006d4e', '#14532d',
      '<strong>Siguiente paso:</strong> contáctalo, confirma si es persona física o moral y pídele su documentación (el enlace para subirla es <strong>firma7.com/documentacion</strong>).'),
    'ID ' || r.id || ' · ' || to_char(now() at time zone 'America/Mexico_City', 'DD/MM/YYYY HH24:MI'));

  perform public._enviar_correo_equipo('🤝 Lead de alianza — ' || p_alianza || ' — ' || coalesce(r.nombre_completo, ''), v_html);
exception when others then
  raise warning '_avisar_registro_alianza: %', sqlerrm;
end;
$function$
;

CREATE OR REPLACE FUNCTION public._avisar_registro_documentacion(p_lead_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'vault', 'extensions'
AS $function$
declare
  v_lead record;
  v_key text;
  v_html text;
  v_resp extensions.http_response;
  v_rows text;
begin
  select * into v_lead from public.leads where id = p_lead_id;
  if not found or v_lead.aviso_registro_enviado then return; end if;

  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'resend_api_key';
  if v_key is null then return; end if;

  v_rows := public._team_row('Nombre', public._esc(v_lead.nombre_completo))
    || public._team_row('Teléfono', public._esc(v_lead.numero))
    || public._team_row('Correo', public._esc(v_lead.correo))
    || public._team_row('Constitución', public._esc(v_lead.constitucion))
    || public._team_row('Empresa', public._esc(v_lead.empresa));

  v_html := public._team_email_shell(
    '#0f766e',
    'Nuevo lead',
    'Un lead entró a subir documentos',
    'Está en la página ahora mismo — es buen momento para contactarlo.',
    public._team_acciones(v_lead.numero),
    public._team_section('Datos del lead', v_rows),
    public._team_nota('#f1f5f9', '#475569', '#334155',
      'Recibirás otro correo con su documentación cuando la termine de subir, o a los 30 minutos si se queda a medias.'),
    'ID ' || v_lead.id || ' · ' || to_char(now() at time zone 'America/Mexico_City', 'DD/MM/YYYY HH24:MI')
  );

  v_resp := extensions.http((
    'POST', 'https://api.resend.com/emails',
    ARRAY[extensions.http_header('Authorization', 'Bearer ' || v_key)],
    'application/json',
    jsonb_build_object(
      'from', 'Firma 7 <notificaciones@firma7.com>',
      'to', jsonb_build_array('saruiz@socasesores.com'),
      'subject', '🆕 Entró a subir documentos — ' || coalesce(v_lead.nombre_completo, '') || ' · ' || coalesce(v_lead.numero, ''),
      'html', v_html
    )::text
  )::extensions.http_request);

  if v_resp.status between 200 and 299 then
    update public.leads set aviso_registro_enviado = true where id = p_lead_id;
  else
    raise warning '_avisar_registro_documentacion: fallo Resend (status %): %', v_resp.status, v_resp.content;
  end if;
exception when others then
  raise warning '_avisar_registro_documentacion: %', sqlerrm;
end;
$function$
;

CREATE OR REPLACE FUNCTION public._client_email_shell(p_icon text, p_header_from text, p_header_to text, p_title text, p_first_name text, p_body_html text, p_cta_url text, p_cta_label text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select '<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>'
    || '<body style="margin:0;padding:0;background:#f2f3f2;font-family:Arial,Helvetica,sans-serif">'
    || '<div style="max-width:560px;margin:0 auto;padding:36px 16px">'
    || '<div style="text-align:center;margin-bottom:22px">'
    || '<span style="font-size:20px;font-weight:800;color:#006d4e;letter-spacing:.5px">SOC</span>'
    || '<span style="display:inline-block;width:1px;height:16px;background:#006d4e;margin:0 8px;vertical-align:middle"></span>'
    || '<span style="font-size:20px;font-weight:500;color:#006d4e">FIRMA 7</span>'
    || '</div>'
    || '<div style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.07);border:1px solid #ececec">'
    || '<div style="background:linear-gradient(135deg,' || p_header_from || ',' || p_header_to || ');padding:38px 32px;text-align:center">'
    || '<div style="width:56px;height:56px;background:rgba(255,255,255,.2);border-radius:50%;display:inline-block;line-height:56px;font-size:26px;margin-bottom:14px">' || p_icon || '</div>'
    || '<h1 style="color:#ffffff;margin:0;font-size:21px;font-family:Georgia,"Times New Roman",serif;font-weight:700;line-height:1.3">' || p_title || '</h1>'
    || '</div>'
    || '<div style="padding:34px 32px 30px">'
    || '<p style="margin:0 0 16px;font-size:15px;color:#1a1a1a">Hola' || (case when coalesce(p_first_name,'') <> '' then ' ' || p_first_name else '' end) || ',</p>'
    || p_body_html
    || '<div style="text-align:center;margin:28px 0 4px">'
    || '<a href="' || p_cta_url || '" style="display:inline-block;background:#006d4e;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 34px;border-radius:999px;box-shadow:0 8px 18px rgba(0,109,78,.28)">' || p_cta_label || '</a>'
    || '</div>'
    || '</div>'
    || '<div style="background:#f7f8f7;padding:16px 32px;border-top:1px solid #ececec">'
    || '<p style="margin:0;font-size:12px;color:#888;text-align:center">¿Dudas? Escríbenos por <a href="https://wa.me/525525069817" style="color:#006d4e;font-weight:600;text-decoration:none">WhatsApp</a></p>'
    || '</div>'
    || '</div>'
    || '<div style="text-align:center;margin-top:22px">'
    || '<p style="margin:0 0 6px;font-size:12px;color:#999">'
    || '<a href="https://www.instagram.com/soc_firma_7/" style="color:#999;text-decoration:none;margin:0 8px">Instagram</a>·'
    || '<a href="https://www.facebook.com/Firma7.Soc" style="color:#999;text-decoration:none;margin:0 8px">Facebook</a>'
    || '</p>'
    || '<p style="margin:0;font-size:11px;color:#bbb">SOC · Firma 7 — Asesoría Financiera Empresarial</p>'
    || '</div>'
    || '</div></body></html>';
$function$
;

CREATE OR REPLACE FUNCTION public._client_email_shell(p_kicker text, p_title text, p_first_name text, p_body_html text, p_cta_url text, p_cta_label text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select '<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><meta name="color-scheme" content="light"/><meta name="supported-color-schemes" content="light"/></head>'
    || '<body style="margin:0;padding:24px 16px;background:#f2f3f2;font-family:Arial,Helvetica,sans-serif">'
    || '<table align="center" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e6e6e6">'
    || '<tr><td style="padding:40px 44px 20px;text-align:center">'
    || '<img src="https://firma7.com/email-logo.png" width="240" height="70" alt="SOC Firma 7" style="display:inline-block;border:0;outline:0">'
    || '</td></tr>'
    || '<tr><td style="padding:0 44px;text-align:center">'
    || '<p style="margin:0 0 18px;font-size:17px;font-weight:700;color:#161616">¡Hola' || (case when coalesce(p_first_name,'') <> '' then ', ' || p_first_name else '' end) || '!</p>'
    || '</td></tr>'
    || '<tr><td style="padding:0 44px">'
    || '<p style="margin:0 0 14px;font-size:15px;font-weight:700;color:#161616;line-height:1.5">' || p_title || '</p>'
    || p_body_html
    || '</td></tr>'
    || (case when coalesce(p_cta_url,'') = '' then
         '<tr><td style="padding:0 0 28px"></td></tr>'
       else
         '<tr><td style="padding:0 44px 36px;text-align:center">'
         || '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>'
         || '<td bgcolor="#006d4e" style="background-color:#006d4e;border-radius:999px;mso-padding-alt:14px 36px">'
         || '<a href="' || p_cta_url || '" style="display:inline-block;padding:14px 36px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;border-radius:999px">' || p_cta_label || '</a>'
         || '</td>'
         || '</tr></table>'
         || '</td></tr>'
       end)
    || '<tr><td style="padding:20px 44px 36px;text-align:center;border-top:1px solid #eee">'
    || '<p style="margin:20px 0 12px;font-size:11px;color:#999">¿Dudas? <a href="https://wa.me/525525069817" style="color:#006d4e;font-weight:600;text-decoration:none">Escríbenos por WhatsApp</a></p>'
    || '<a href="https://www.instagram.com/soc_firma_7/" style="display:inline-block;margin:0 4px"><img src="https://firma7.com/social-instagram.jpg" width="22" height="22" alt="Instagram" style="display:inline-block;border:0;border-radius:6px"></a>'
    || '<a href="https://www.facebook.com/Firma7.Soc" style="display:inline-block;margin:0 4px"><img src="https://firma7.com/social-facebook.jpg" width="22" height="22" alt="Facebook" style="display:inline-block;border:0;border-radius:6px"></a>'
    || '<p style="margin:14px 0 0;font-size:10px;color:#bbb">SOC · Firma 7 — Asesoría Financiera Empresarial</p>'
    || '</td></tr>'
    || '</table>'
    || '</body></html>';
$function$
;

CREATE OR REPLACE FUNCTION public._correo_opinion_gracias(p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  r record; v_token uuid; v_acciones text; v_cal int; v_color text; v_kicker text; v_estrellas text; v_content text; v_after text := ''; v_com text; v_subject text;
begin
  select * into r from public.referidos_clientes where id = p_id;
  if not found then return null; end if;
  v_cal := coalesce(r.calificacion, 0);
  v_estrellas := repeat('★', v_cal) || repeat('☆', 5 - v_cal);
  v_color := case when v_cal >= 4 then '#006d4e' when v_cal = 3 then '#92400e' else '#991b1b' end;
  v_kicker := case when v_cal >= 4 then 'Nueva opinión de cliente' when v_cal = 3 then 'Opinión de cliente · regular' else 'Opinión de cliente · requiere atención' end;
  v_com := nullif(trim(coalesce(r.comentario, '')), '');
  select aprobar_token into v_token from public.testimonios where referido_id = p_id;
  v_acciones := case
    when v_com is not null and r.autoriza_publicar and v_token is not null
      then public._team_acciones_extra(r.referido_por_telefono, 'https://firma7.com/aprobar-testimonio?t=' || v_token, 'Publicar testimonio', '#b45309')
    else public._team_acciones(r.referido_por_telefono) end;

  v_content := public._team_section('Quién opina',
        public._team_row('Nombre', public._esc(r.referido_por_nombre))
     || public._team_row('Empresa', public._esc(r.referido_por_empresa))
     || public._team_row('Correo', public._esc(r.referido_por_correo))
     || public._team_row('Teléfono', public._esc(r.referido_por_telefono)))
   || public._team_section('Valoración',
        public._team_row('Calificación', '<span style="color:#f59e0b;font-size:16px;letter-spacing:2px">' || v_estrellas || '</span> <span style="font-weight:400;color:#6b7280">' || v_cal || ' de 5</span>')
     || public._team_row('Permiso para publicar',
          case when v_com is null then null
               when r.autoriza_publicar then 'Sí autorizó publicar su comentario ✅'
               else '<span style="color:#b45309">No autorizó publicarlo (solo retroalimentación interna)</span>' end));

  if v_com is not null then
    v_content := v_content || public._team_section('Comentario',
      '<tr><td colspan="2" style="padding:14px 0;font-size:15px;line-height:1.6;color:#111827;font-style:italic;font-family:Arial,Helvetica,sans-serif">“' || public._esc(v_com) || '”</td></tr>');
  end if;

  if v_cal <= 3 then
    v_after := public._team_nota('#fef2f2', '#dc2626', '#991b1b', '<strong>Atención:</strong> la calificación es baja. Conviene que un asesor contacte al cliente pronto para entender qué pasó.');
  elsif v_com is not null and r.autoriza_publicar then
    v_after := public._team_nota('#f0faf5', '#006d4e', '#14532d', '<strong>Testimonio:</strong> el cliente autorizó publicar su comentario. Usa el botón <strong>Publicar testimonio</strong> de arriba (te pedirá confirmar) o apruébalo después en el panel <strong>/admin</strong>.');
  end if;

  v_subject := case when v_cal <= 3 then '⚠️ Opinión baja (' || v_cal || '/5) — ' else '⭐ Nueva opinión (' || v_cal || '/5) — ' end || r.referido_por_nombre;

  return jsonb_build_object('subject', v_subject, 'html', public._team_email_shell(
    v_color, v_kicker, public._esc(r.referido_por_nombre), v_estrellas || ' &nbsp;' || v_cal || ' de 5',
    v_acciones, v_content, v_after,
    'ID ' || r.id || ' · ' || to_char(r.created_at at time zone 'America/Mexico_City', 'DD/MM/YYYY HH24:MI')));
end;
$function$
;

CREATE OR REPLACE FUNCTION public._correo_referidos_gracias(p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  r record; it record; v_n int; v_content text; v_resumen text; v_tel text;
begin
  select * into r from public.referidos_clientes where id = p_id;
  if not found then return null; end if;
  select count(*) into v_n from public.referidos_gracias_items where envio_id = p_id;
  if v_n = 0 then return null; end if;

  v_content := public._team_section('Quién refiere',
        public._team_row('Nombre', public._esc(r.referido_por_nombre))
     || public._team_row('Empresa', public._esc(r.referido_por_empresa))
     || public._team_row('Correo', public._esc(r.referido_por_correo))
     || public._team_row('Teléfono', public._esc(r.referido_por_telefono)));

  for it in select * from public.referidos_gracias_items where envio_id = p_id order by orden loop
    v_tel := regexp_replace(coalesce(it.telefono, ''), '\D', '', 'g');
    v_content := v_content || public._team_section(
      'Referido ' || it.orden || ' · ' || case it.tipo_credito when 'automotriz' then 'Crédito automotriz' when 'hipotecario' then 'Crédito hipotecario' else 'Crédito empresarial' end,
         public._team_row('Nombre', public._esc(it.nombre))
      || public._team_row('Teléfono', public._esc(it.telefono))
      || public._team_row('Correo', public._esc(it.correo))
      || public._team_row('Empresa', public._esc(it.empresa))
      || public._team_row('Contactar',
           '<a href="https://wa.me/52' || v_tel || '" style="display:inline-block;padding:3px 12px;border:1px solid #1fa855;border-radius:999px;color:#1fa855;font-size:12px;font-weight:700;text-decoration:none">WhatsApp</a> '
           || '<a href="tel:+52' || v_tel || '" style="display:inline-block;padding:3px 12px;border:1px solid #006d4e;border-radius:999px;color:#006d4e;font-size:12px;font-weight:700;text-decoration:none">Llamar</a>'));
  end loop;

  select string_agg(c || ' ' || case t when 'automotriz' then 'automotriz' when 'hipotecario' then 'hipotecario' else 'empresarial' end, ' · ' order by t)
    into v_resumen
    from (select tipo_credito t, count(*) c from public.referidos_gracias_items where envio_id = p_id group by tipo_credito) x;

  return jsonb_build_object(
    'subject', '🤝 ' || case when v_n = 1 then 'Nuevo referido' else 'Nuevos referidos (' || v_n || ')' end || ' — ' || r.referido_por_nombre,
    'html', public._team_email_shell(
      '#006d4e', case when v_n = 1 then 'Nuevo referido' else 'Nuevos referidos' end,
      public._esc(r.referido_por_nombre) || ' recomendó ' || v_n || case when v_n = 1 then ' persona' else ' personas' end,
      v_resumen, public._team_acciones(r.referido_por_telefono), v_content,
      public._team_nota('#f0faf5', '#006d4e', '#14532d', '<strong>Al contactarlos,</strong> menciona que vienen recomendados por <strong>' || public._esc(r.referido_por_nombre) || '</strong>.'),
      'ID ' || r.id || ' · ' || to_char(now() at time zone 'America/Mexico_City', 'DD/MM/YYYY HH24:MI')));
end;
$function$
;

CREATE OR REPLACE FUNCTION public._document_label(p_tipo text, p_slot integer)
 RETURNS text
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select case p_tipo
    when 'constancia_situacion_fiscal' then 'Constancia de situación fiscal'
    when 'ine' then case when p_slot >= 2 then 'INE — reverso' else 'INE — frente' end
    when 'declaracion_anual' then 'Declaración anual '
      || (extract(year from (now() at time zone 'America/Mexico_City'))::int
          - case when extract(month from (now() at time zone 'America/Mexico_City')) >= 4 then 1 else 2 end)
    when 'estado_cuenta' then 'Estado de cuenta — mes ' || (p_slot % 10)
    when 'comprobante_domicilio_fiscal' then 'Comprobante de domicilio fiscal'
    when 'comprobante_domicilio_particular' then 'Comprobante de domicilio particular'
    when 'comprobante_domicilio_operativo' then 'Comprobante de domicilio operativo'
    when 'acta_constitutiva' then 'Acta constitutiva'
    when 'escrituras_modificaciones' then 'Escrituras con modificaciones'
    when 'ine_accionista' then case when p_slot >= 100 then 'INE del accionista — reverso' else 'INE del accionista — frente' end
    when 'comprobante_domicilio_accionista' then 'Comprobante de domicilio del accionista'
    when 'constancia_situacion_fiscal_accionista' then 'Constancia de situación fiscal del accionista'
    when 'acta_matrimonio_accionista' then 'Acta de matrimonio del accionista'
    else p_tipo
  end;
$function$
;

CREATE OR REPLACE FUNCTION public._enviar_codigo_lead(p_lead_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'vault', 'extensions'
AS $function$
declare
  v_lead public.leads;
  v_resend_key text;
  v_bytes bytea;
  v_codigo text;
  v_html text;
  v_resp extensions.http_response;
  v_first_name text;
  v_body text;
begin
  select * into v_lead from public.leads where id = p_lead_id;
  if not found or coalesce(trim(v_lead.correo), '') = '' then
    return jsonb_build_object('sent', false, 'reason', 'sin_correo');
  end if;

  delete from public.lead_codigos_acceso where created_at < now() - interval '1 day';

  if exists (select 1 from public.lead_codigos_acceso where lead_id = p_lead_id and created_at > now() - interval '60 seconds') then
    return jsonb_build_object('sent', false, 'reason', 'espera');
  end if;
  if (select count(*) from public.lead_codigos_acceso where lead_id = p_lead_id and created_at > now() - interval '1 hour') >= 5 then
    return jsonb_build_object('sent', false, 'reason', 'limite');
  end if;

  select decrypted_secret into v_resend_key from vault.decrypted_secrets where name = 'resend_api_key';
  if v_resend_key is null then
    return jsonb_build_object('sent', false, 'reason', 'no_resend_key');
  end if;

  v_bytes := extensions.gen_random_bytes(4);
  v_codigo := lpad(((get_byte(v_bytes,0)::bigint * 16777216 + get_byte(v_bytes,1) * 65536 + get_byte(v_bytes,2) * 256 + get_byte(v_bytes,3)) % 1000000)::text, 6, '0');

  update public.lead_codigos_acceso set usado = true where lead_id = p_lead_id and not usado;
  insert into public.lead_codigos_acceso (lead_id, codigo_hash, expires_at)
  values (p_lead_id, encode(extensions.digest(v_codigo || ':' || p_lead_id::text, 'sha256'), 'hex'), now() + interval '10 minutes');

  v_first_name := split_part(coalesce(v_lead.nombre_completo, ''), ' ', 1);
  v_body := '<p style="margin:0 0 18px;font-size:14px;color:#555;line-height:1.7">Usa este código para continuar tu trámite. Vence en 10 minutos.</p>'
    || '<p style="margin:0 0 22px;text-align:center;font-size:34px;letter-spacing:8px;font-weight:700;color:#006d4e;font-family:Arial,Helvetica,sans-serif">' || v_codigo || '</p>'
    || '<p style="margin:0;font-size:12px;color:#999;line-height:1.6">Si no fuiste tú, ignora este correo: nadie puede entrar a tu trámite sin este código.</p>';
  v_html := public._client_email_shell('', 'Tu código de acceso', v_first_name, v_body, '', '');

  v_resp := extensions.http((
    'POST',
    'https://api.resend.com/emails',
    ARRAY[extensions.http_header('Authorization', 'Bearer ' || v_resend_key)],
    'application/json',
    jsonb_build_object('from', 'Firma 7 <notificaciones@firma7.com>', 'to', jsonb_build_array(v_lead.correo), 'subject', 'Tu código de acceso — Firma 7', 'html', v_html)::text
  )::extensions.http_request);

  if v_resp.status between 200 and 299 then
    return jsonb_build_object('sent', true);
  end if;
  raise warning '_enviar_codigo_lead: fallo Resend (status %): %', v_resp.status, v_resp.content;
  return jsonb_build_object('sent', false, 'reason', 'resend_error');
end;
$function$
;

CREATE OR REPLACE FUNCTION public._enviar_correo_equipo(p_subject text, p_html text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'vault', 'extensions'
AS $function$
declare v_key text; v_resp extensions.http_response;
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'resend_api_key';
  if v_key is null then return false; end if;
  v_resp := extensions.http((
    'POST', 'https://api.resend.com/emails',
    ARRAY[extensions.http_header('Authorization', 'Bearer ' || v_key)],
    'application/json',
    jsonb_build_object('from', 'Firma 7 <notificaciones@firma7.com>', 'to', jsonb_build_array('saruiz@socasesores.com'), 'subject', p_subject, 'html', p_html)::text
  )::extensions.http_request);
  if v_resp.status between 200 and 299 then return true; end if;
  raise warning '_enviar_correo_equipo: fallo Resend (status %): %', v_resp.status, v_resp.content;
  return false;
end;
$function$
;

CREATE OR REPLACE FUNCTION public._esc(p text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select replace(replace(replace(replace(coalesce(p, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;');
$function$
;

CREATE OR REPLACE FUNCTION public._lead_resumen_documentos(p_lead_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_moral boolean;
  v_total int;
  v_subidos int;
  v_faltan text[];
begin
  select coalesce(constitucion = 'Persona Moral', false) into v_moral from public.leads where id = p_lead_id;

  create temporary table if not exists _exp_docs (tipo text, slot int, etiqueta text) on commit drop;
  truncate _exp_docs;

  insert into _exp_docs values
    ('constancia_situacion_fiscal', 1, 'Constancia de situación fiscal'),
    ('declaracion_anual', 1, public._document_label('declaracion_anual', 1)),
    ('comprobante_domicilio_fiscal', 1, 'Comprobante de domicilio fiscal');

  if v_moral then
    insert into _exp_docs values
      ('acta_constitutiva', 1, 'Acta constitutiva'),
      ('comprobante_domicilio_operativo', 1, 'Comprobante de domicilio operativo');
    -- Representante legal (o el único accionista)
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
      and (a.es_representante_legal or (select count(*) from public.lead_accionistas where lead_id = p_lead_id) = 1);
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
$function$
;

CREATE OR REPLACE FUNCTION public._lead_tiene_avance(p_lead_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from public.lead_documentos where lead_id = p_lead_id)
      or exists (select 1 from public.lead_accionistas where lead_id = p_lead_id)
      or exists (select 1 from public.lead_bancos where lead_id = p_lead_id)
      or exists (select 1 from public.leads where id = p_lead_id and (ciec_encrypted is not null or documentos_status = 'completo'));
$function$
;

CREATE OR REPLACE FUNCTION public._resend_lead_link_email_impl(p_lead_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'vault', 'extensions'
AS $function$
declare
  v_resend_key text;
  v_lead public.leads;
  v_html text;
  v_resp extensions.http_response;
  v_link text;
  v_first_name text;
  v_body_html text;
begin
  select * into v_lead from public.leads where id = p_lead_id;
  if not found or coalesce(trim(v_lead.correo), '') = '' then
    return jsonb_build_object('sent', false, 'reason', 'lead_not_found_or_no_email');
  end if;

  if v_lead.cliente_link_reenviado_at is not null and v_lead.cliente_link_reenviado_at > now() - interval '2 minutes' then
    return jsonb_build_object('sent', false, 'reason', 'rate_limited');
  end if;

  select decrypted_secret into v_resend_key from vault.decrypted_secrets where name = 'resend_api_key';
  if v_resend_key is null then
    return jsonb_build_object('sent', false, 'reason', 'no_resend_key');
  end if;

  v_first_name := split_part(coalesce(v_lead.nombre_completo, ''), ' ', 1);
  v_link := public._lead_tramite_link(v_lead);

  v_body_html := '<p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7">Como lo pediste, aquí tienes tu enlace personal para continuar tu trámite con Firma 7 en cualquier momento. Guarda este correo — es la forma más fácil de volver.</p>';

  v_html := public._client_email_shell(
    'Este correo es una notificación automática de tu trámite con Firma 7.',
    'Tu enlace personal para continuar tu trámite con Firma 7.',
    v_first_name, v_body_html, v_link, 'Ir a mi trámite'
  );

  v_resp := extensions.http((
    'POST',
    'https://api.resend.com/emails',
    ARRAY[extensions.http_header('Authorization', 'Bearer ' || v_resend_key)],
    'application/json',
    jsonb_build_object('from', 'Firma 7 <notificaciones@firma7.com>', 'to', jsonb_build_array(v_lead.correo), 'subject', 'Tu enlace para continuar tu trámite — Firma 7', 'html', v_html)::text
  )::extensions.http_request);

  if v_resp.status between 200 and 299 then
    update public.leads set cliente_link_reenviado_at = now() where id = p_lead_id;
    return jsonb_build_object('sent', true);
  else
    return jsonb_build_object('sent', false, 'reason', 'resend_error', 'status', v_resp.status);
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public._send_client_status_email_impl(p_lead_id uuid, p_kind text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'vault', 'extensions'
AS $function$
declare
  v_resend_key text;
  v_lead public.leads;
  v_html text;
  v_resp extensions.http_response;
  v_subject text;
  v_link text;
  v_first_name text;
  v_kicker text;
  v_title text;
  v_body_p1 text;
  v_body_p2 text;
  v_cta_label text;
  v_body_html text;
begin
  if p_kind not in ('recibido', 'recordatorio') then
    raise exception 'p_kind invalido: %', p_kind;
  end if;

  select * into v_lead from public.leads where id = p_lead_id;
  if not found or coalesce(trim(v_lead.correo), '') = '' then
    return jsonb_build_object('sent', false, 'reason', 'lead_not_found_or_no_email');
  end if;

  if p_kind = 'recibido' and v_lead.cliente_recibido_email_enviado then
    return jsonb_build_object('sent', false, 'reason', 'already_sent');
  end if;
  if p_kind = 'recordatorio' and v_lead.cliente_recordatorio_incompleto_email_enviado then
    return jsonb_build_object('sent', false, 'reason', 'already_sent');
  end if;

  select decrypted_secret into v_resend_key from vault.decrypted_secrets where name = 'resend_api_key';
  if v_resend_key is null then
    return jsonb_build_object('sent', false, 'reason', 'no_resend_key');
  end if;

  v_first_name := split_part(coalesce(v_lead.nombre_completo, ''), ' ', 1);
  v_link := public._lead_tramite_link(v_lead);

  if p_kind = 'recibido' then
    v_kicker := 'Este correo es una notificación automática de tu trámite con Firma 7.';
    v_title := 'Recibimos tu documentación para tu solicitud de crédito con Firma 7.';
    v_body_p1 := 'Nuestro equipo la revisará y te contactará en las próximas <strong>24–72 horas</strong> con los siguientes pasos. Si necesitas actualizar algún archivo, puedes volver a tu trámite cuando quieras:';
    v_cta_label := 'Ver mi trámite';
    v_subject := 'Recibimos tu documentación — Firma 7';
  else
    v_kicker := 'Este correo es una notificación automática de tu trámite con Firma 7.';
    v_title := 'Aún tienes documentación pendiente por subir con Firma 7.';
    v_body_p1 := 'Tu progreso quedó guardado — solo entra a tu enlace personal para continuar donde te quedaste:';
    v_cta_label := 'Continuar mi trámite';
    v_subject := 'Te faltan documentos por subir — Firma 7';
  end if;

  v_body_html := '<p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7">' || v_body_p1 || '</p>';

  v_html := public._client_email_shell(v_kicker, v_title, v_first_name, v_body_html, v_link, v_cta_label);

  v_resp := extensions.http((
    'POST',
    'https://api.resend.com/emails',
    ARRAY[extensions.http_header('Authorization', 'Bearer ' || v_resend_key)],
    'application/json',
    jsonb_build_object('from', 'Firma 7 <notificaciones@firma7.com>', 'to', jsonb_build_array(v_lead.correo), 'subject', v_subject, 'html', v_html)::text
  )::extensions.http_request);

  if v_resp.status between 200 and 299 then
    if p_kind = 'recibido' then
      update public.leads set cliente_recibido_email_enviado = true where id = p_lead_id;
    else
      update public.leads set cliente_recordatorio_incompleto_email_enviado = true where id = p_lead_id;
    end if;
    return jsonb_build_object('sent', true);
  else
    raise warning 'send_client_status_email: fallo Resend (status %): %', v_resp.status, v_resp.content;
    return jsonb_build_object('sent', false, 'reason', 'resend_error', 'status', v_resp.status);
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public._team_acciones(p_numero text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
declare v_d text := regexp_replace(coalesce(p_numero, ''), '\D', '', 'g');
begin
  if length(v_d) <> 10 then return ''; end if;
  return '<tr><td style="padding:22px 32px 0"><table role="presentation" cellpadding="0" cellspacing="0"><tr>'
    || public._team_btn('https://wa.me/52' || v_d, 'WhatsApp al cliente', '#1fa855')
    || '<td width="10"></td>'
    || public._team_btn('tel:+52' || v_d, 'Llamar ' || v_d, '#006d4e')
    || '</tr></table></td></tr>';
end;
$function$
;

CREATE OR REPLACE FUNCTION public._team_acciones_extra(p_numero text, p_url text, p_label text, p_bg text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
declare v_d text := regexp_replace(coalesce(p_numero, ''), '\D', '', 'g'); v_btns text := '';
begin
  if length(v_d) = 10 then
    v_btns := public._team_btn('https://wa.me/52' || v_d, 'WhatsApp al cliente', '#1fa855') || '<td width="10"></td>'
           || public._team_btn('tel:+52' || v_d, 'Llamar ' || v_d, '#006d4e') || '<td width="10"></td>';
  end if;
  return '<tr><td style="padding:22px 32px 0"><table role="presentation" cellpadding="0" cellspacing="0"><tr>'
    || v_btns || public._team_btn(p_url, p_label, p_bg) || '</tr></table></td></tr>';
end;
$function$
;

CREATE OR REPLACE FUNCTION public._team_btn(p_url text, p_label text, p_bg text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select '<td bgcolor="' || p_bg || '" style="background-color:' || p_bg || ';border-radius:999px;mso-padding-alt:12px 24px">'
    || '<a href="' || p_url || '" style="display:inline-block;padding:12px 24px;font-size:13px;font-weight:700;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;border-radius:999px">' || p_label || '</a></td>';
$function$
;

CREATE OR REPLACE FUNCTION public._team_email_shell(p_color text, p_kicker text, p_title text, p_subtitle text, p_acciones text, p_content text, p_after text, p_footer text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select '<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>'
    || '<meta name="color-scheme" content="light"/><meta name="supported-color-schemes" content="light"/></head>'
    || '<body bgcolor="#f2f3f2" style="margin:0;padding:24px 12px;background:#f2f3f2;font-family:Arial,Helvetica,sans-serif">'
    || '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f2f3f2"><tr><td align="center">'
    || '<table role="presentation" width="640" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="width:100%;max-width:640px;background:#ffffff;border:1px solid #e6e6e6;border-radius:12px">'
    -- logo
    || '<tr><td align="center" style="padding:26px 32px 18px"><img src="https://firma7.com/email-logo.png" width="190" height="55" alt="SOC Firma 7" style="display:block;border:0;outline:0"></td></tr>'
    -- banda de estado
    || '<tr><td bgcolor="' || p_color || '" style="background-color:' || p_color || ';padding:22px 32px">'
    || '<p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#d6ece3;font-family:Arial,Helvetica,sans-serif">' || p_kicker || '</p>'
    || '<p style="margin:0;font-size:21px;font-weight:700;line-height:1.3;color:#ffffff;font-family:Arial,Helvetica,sans-serif">' || p_title || '</p>'
    || '<p style="margin:6px 0 0;font-size:13px;line-height:1.5;color:#e6f4ee;font-family:Arial,Helvetica,sans-serif">' || p_subtitle || '</p>'
    || '</td></tr>'
    || coalesce(p_acciones, '')
    || '<tr><td style="padding:6px 32px 8px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' || p_content || '</table></td></tr>'
    || coalesce(p_after, '')
    || '<tr><td bgcolor="#f7f8f7" align="center" style="background-color:#f7f8f7;padding:16px 32px;border-top:1px solid #eeeeee;border-radius:0 0 12px 12px">'
    || '<p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6;font-family:Arial,Helvetica,sans-serif">' || p_footer || '</p>'
    || '<p style="margin:4px 0 0;font-size:11px;color:#b5b9b6;font-family:Arial,Helvetica,sans-serif">SOC · Firma 7 — notificación interna</p>'
    || '</td></tr>'
    || '</table></td></tr></table></body></html>';
$function$
;

CREATE OR REPLACE FUNCTION public._team_nota(p_bg text, p_borde text, p_color text, p_html text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select '<tr><td style="padding:14px 32px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>'
    || '<td bgcolor="' || p_bg || '" style="background-color:' || p_bg || ';border-left:4px solid ' || p_borde || ';padding:12px 16px;border-radius:6px;font-size:12px;line-height:1.6;color:' || p_color || ';font-family:Arial,Helvetica,sans-serif">'
    || p_html || '</td></tr></table></td></tr>';
$function$
;

CREATE OR REPLACE FUNCTION public._team_row(p_label text, p_value text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select case when p_value is null or p_value = '' then ''
    else '<tr><td width="36%" valign="top" style="padding:10px 12px 10px 0;font-size:13px;color:#6b7280;border-bottom:1px solid #eeeeee;font-family:Arial,Helvetica,sans-serif">' || p_label
      || '</td><td valign="top" style="padding:10px 0;font-size:13px;color:#111827;font-weight:600;border-bottom:1px solid #eeeeee;font-family:Arial,Helvetica,sans-serif">' || p_value || '</td></tr>'
  end;
$function$
;

CREATE OR REPLACE FUNCTION public._team_section(p_title text, p_rows text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select case when coalesce(p_rows, '') = '' then ''
    else '<tr><td colspan="2" style="padding:24px 0 6px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#006d4e;border-bottom:2px solid #dcefe6;font-family:Arial,Helvetica,sans-serif">' || p_title || '</td></tr>' || p_rows
  end;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_list_referidos_gracias_items(p_passcode text)
 RETURNS SETOF referidos_gracias_items
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform public._check_admin_passcode(p_passcode);
  return query select * from public.referidos_gracias_items order by created_at desc, orden;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_set_testimonio_aprobado(p_passcode text, p_id uuid, p_aprobado boolean, p_orden integer DEFAULT NULL::integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform public._check_admin_passcode(p_passcode);
  if p_aprobado and exists (select 1 from public.testimonios where id = p_id and not autoriza_publicar) then
    raise exception 'Este cliente no autorizó publicar su comentario';
  end if;
  update public.testimonios set aprobado = p_aprobado, orden = coalesce(p_orden, orden) where id = p_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.agregar_referidos_gracias(p_id uuid, p jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  it jsonb; n int := 0; v_nom text; v_tel text; v_cor text; v_emp text; v_tipo text;
begin
  if not exists (select 1 from public.referidos_clientes where id = p_id and finalizado_at is null) then
    raise exception 'Envio no encontrado o ya finalizado';
  end if;
  if jsonb_typeof(coalesce(p, '[]'::jsonb)) <> 'array' then raise exception 'Formato invalido'; end if;
  if jsonb_array_length(coalesce(p, '[]'::jsonb)) > 7 then raise exception 'Maximo 7 referidos'; end if;

  delete from public.referidos_gracias_items where envio_id = p_id;
  for it in select * from jsonb_array_elements(coalesce(p, '[]'::jsonb)) loop
    n := n + 1;
    v_nom := trim(coalesce(it->>'nombre', ''));
    v_tel := regexp_replace(coalesce(it->>'telefono', ''), '\D', '', 'g');
    if length(v_tel) > 10 then v_tel := right(v_tel, 10); end if;
    v_cor := nullif(trim(coalesce(it->>'correo', '')), '');
    v_emp := nullif(trim(coalesce(it->>'empresa', '')), '');
    v_tipo := coalesce(it->>'tipoCredito', '');
    if v_nom = '' then raise exception 'Falta el nombre del referido %', n; end if;
    if length(v_tel) <> 10 then raise exception 'Telefono invalido en el referido %', n; end if;
    if v_tipo not in ('automotriz', 'hipotecario', 'empresarial') then raise exception 'Falta el tipo de credito del referido %', n; end if;
    if v_cor is not null and position('@' in v_cor) = 0 then raise exception 'Correo invalido en el referido %', n; end if;
    insert into public.referidos_gracias_items (envio_id, orden, nombre, telefono, correo, empresa, tipo_credito)
    values (p_id, n, left(v_nom, 120), v_tel, left(v_cor, 160), left(v_emp, 160), v_tipo);
  end loop;

  update public.referidos_clientes set finalizado_at = now() where id = p_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.decidir_testimonio_por_token(p_token uuid, p_publicar boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare t record;
begin
  select * into t from public.testimonios where aprobar_token = p_token;
  if not found then return jsonb_build_object('ok', false, 'motivo', 'no_encontrado'); end if;
  if p_publicar and not t.autoriza_publicar then
    return jsonb_build_object('ok', false, 'motivo', 'sin_autorizacion');
  end if;
  update public.testimonios set aprobado = p_publicar where id = t.id;
  return jsonb_build_object('ok', true, 'publicado', p_publicar);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_lead_accionista(p_lead_id uuid, p_slot_index smallint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  delete from public.lead_documentos
  where lead_id = p_lead_id
    and (
      (slot_index = p_slot_index and tipo_documento in ('ine_accionista', 'comprobante_domicilio_accionista', 'constancia_situacion_fiscal_accionista', 'acta_matrimonio_accionista'))
      or (slot_index = p_slot_index + 100 and tipo_documento = 'ine_accionista')
    );

  delete from public.lead_accionistas
  where lead_id = p_lead_id and slot_index = p_slot_index;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_lead_progreso(p_lead_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select jsonb_build_object(
    'documentos', coalesce((
      select jsonb_agg(jsonb_build_object('tipoDocumento', tipo_documento, 'slotIndex', slot_index, 'fileName', file_name, 'purgado', purgado_at is not null))
      from public.lead_documentos where lead_id = p_lead_id
    ), '[]'::jsonb),
    'accionistas', coalesce((
      select jsonb_agg(jsonb_build_object(
        'slotIndex', slot_index, 'nombre', nombre, 'porcentaje', porcentaje,
        'esRepresentanteLegal', es_representante_legal, 'correo', correo, 'telefono', telefono
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
    'primerNombre', (select nullif(split_part(trim(nombre_completo), ' ', 1), '') from public.leads where id = p_lead_id),
    'contactoPreferido', (select contacto_preferido from public.leads where id = p_lead_id),
    'contactoHorario', (select contacto_horario from public.leads where id = p_lead_id)
  );
$function$
;

CREATE OR REPLACE FUNCTION public.guardar_opinion_gracias(p jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid := nullif(p->>'id', '')::uuid;
  v_nombre text := trim(coalesce(p->>'nombre', ''));
  v_correo text := trim(coalesce(p->>'correo', ''));
  v_tel text := regexp_replace(coalesce(p->>'telefono', ''), '\D', '', 'g');
  v_empresa text := nullif(trim(coalesce(p->>'empresa', '')), '');
  v_cal int := (p->>'calificacion')::int;
  v_comentario text := left(trim(coalesce(p->>'comentario', '')), 500);
  v_autoriza boolean := coalesce((p->>'autoriza')::boolean, false);
begin
  if v_nombre = '' then raise exception 'Falta el nombre'; end if;
  if length(v_tel) > 10 then v_tel := right(v_tel, 10); end if;
  if v_tel <> '' and length(v_tel) <> 10 then raise exception 'Telefono invalido'; end if;
  if v_cal is null or v_cal not between 1 and 5 then raise exception 'Calificacion invalida'; end if;

  if v_id is not null and exists (select 1 from public.referidos_clientes where id = v_id and finalizado_at is null) then
    update public.referidos_clientes set
      referido_por_nombre = v_nombre, referido_por_empresa = v_empresa, referido_por_correo = nullif(v_correo, ''),
      referido_por_telefono = nullif(v_tel, ''), comentario = nullif(v_comentario, ''), calificacion = v_cal, autoriza_publicar = v_autoriza
    where id = v_id;
  else
    insert into public.referidos_clientes (referido_por_nombre, referido_por_empresa, referido_por_correo, referido_por_telefono, comentario, calificacion, autoriza_publicar)
    values (v_nombre, v_empresa, nullif(v_correo, ''), nullif(v_tel, ''), nullif(v_comentario, ''), v_cal, v_autoriza)
    returning id into v_id;
  end if;

  if v_comentario <> '' then
    insert into public.testimonios (referido_id, nombre, empresa, comentario, calificacion, autoriza_publicar)
    values (v_id, v_nombre, v_empresa, v_comentario, v_cal, v_autoriza)
    on conflict (referido_id) where referido_id is not null do update
      set nombre = excluded.nombre, empresa = excluded.empresa, comentario = excluded.comentario,
          calificacion = excluded.calificacion, autoriza_publicar = excluded.autoriza_publicar;
  else
    delete from public.testimonios where referido_id = v_id and aprobado = false;
  end if;

  perform public._avisar_opinion_gracias(v_id);
  return v_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.guardar_preferencia_contacto(p_lead_id uuid, p_canal text, p_horario text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if p_canal not in ('whatsapp', 'llamada') then raise exception 'canal invalido'; end if;
  if p_horario not in ('cualquiera', 'manana', 'tarde') then raise exception 'horario invalido'; end if;
  update public.leads set contacto_preferido = p_canal, contacto_horario = p_horario where id = p_lead_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_lead_inserted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'vault'
AS $function$
declare
  v_secret text;
begin
  if new.evento = 'lead_calificado' then
    return new;
  end if;

  -- Los leads de "documentación directa" (clientes de Facebook, ya en GHL y ya
  -- contactados por el equipo) no deben generar el correo de aviso normal de
  -- leads nuevos — ese correo está pensado para leads que vienen del
  -- perfilamiento del sitio, no para estos.
  if new.evento in ('documentacion_directa', 'alianza_directa') then
    return new;
  end if;

  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'lead_notify_webhook_secret';
  if v_secret is null then
    raise warning 'notify_lead_inserted: lead_notify_webhook_secret no configurado en vault';
    return new;
  end if;

  perform net.http_post(
    url     := 'https://pkfnmpdlrbpnlerttoaz.supabase.co/functions/v1/notify-lead',
    body    := jsonb_build_object('record', row_to_json(new)),
    headers := jsonb_build_object(
      'Content-Type',     'application/json',
      'x-webhook-secret', v_secret
    )
  );
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_referido_inserted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'vault'
AS $function$
declare v_secret text;
begin
  if tg_op = 'UPDATE' then
    if old.finalizado_at is null and new.finalizado_at is not null then
      perform public._avisar_referidos_gracias(new.id);
    end if;
    return new;
  end if;

  -- INSERT: solo el formulario anterior (trae el referido 1 completo)
  if new.referido_1_empresa is null then return new; end if;
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'referido_notify_webhook_secret';
  if v_secret is null then
    raise warning 'notify_referido_inserted: referido_notify_webhook_secret no configurado en vault';
    return new;
  end if;
  perform net.http_post(
    url     := 'https://pkfnmpdlrbpnlerttoaz.supabase.co/functions/v1/notify-referido',
    body    := jsonb_build_object('record', row_to_json(new)),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret)
  );
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.purge_expired_lead_documentos()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'vault', 'extensions'
AS $function$
declare
  v_key text;
  r record;
  v_resp extensions.http_response;
  c_project_url constant text := 'https://pkfnmpdlrbpnlerttoaz.supabase.co';
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'storage_service_role_key';
  if v_key is null then
    raise warning 'purge_expired_lead_documentos: storage_service_role_key no configurada';
    return;
  end if;

  -- Solo se borran los archivos vencidos (>7 días); el registro queda marcado como purgado.
  for r in
    select lead_id, array_agg(id) as ids, array_agg(storage_path) as paths
    from public.lead_documentos
    where purgado_at is null and created_at < now() - interval '7 days'
    group by lead_id
  loop
    begin
      v_resp := extensions.http((
        'DELETE',
        c_project_url || '/storage/v1/object/lead-documentos',
        ARRAY[
          extensions.http_header('Authorization', 'Bearer ' || v_key),
          extensions.http_header('apikey', v_key)
        ],
        'application/json',
        jsonb_build_object('prefixes', r.paths)::text
      )::extensions.http_request);

      if v_resp.status between 200 and 299 then
        update public.lead_documentos set purgado_at = now() where id = any(r.ids);
      else
        raise warning 'purge_expired_lead_documentos: fallo lead % (status %): %', r.lead_id, v_resp.status, v_resp.content;
      end if;
    exception when others then
      raise warning 'purge_expired_lead_documentos: error lead %: %', r.lead_id, sqlerrm;
    end;
  end loop;

  -- La CIEC se borra a los 7 días de capturada (se conserva solo el hecho de que se recibió).
  update public.leads
    set ciec_encrypted = null, ciec_purgada_at = now()
    where ciec_encrypted is not null and ciec_guardada_at < now() - interval '7 days';
end;
$function$
;

CREATE OR REPLACE FUNCTION public.record_document_upload(p_lead_id uuid, p_tipo_documento text, p_slot_index smallint, p_storage_path text, p_file_name text, p_file_size_bytes integer, p_mime_type text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.lead_documentos (lead_id, tipo_documento, slot_index, storage_path, file_name, file_size_bytes, mime_type)
  values (p_lead_id, p_tipo_documento, p_slot_index, p_storage_path, p_file_name, p_file_size_bytes, p_mime_type)
  on conflict (lead_id, tipo_documento, slot_index) do update set
    storage_path = excluded.storage_path,
    file_name = excluded.file_name,
    file_size_bytes = excluded.file_size_bytes,
    mime_type = excluded.mime_type,
    purgado_at = null,
    created_at = now();
end;
$function$
;

CREATE OR REPLACE FUNCTION public.registrar_lead_alianza(p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_slug text := lower(trim(coalesce(p->>'alianza', '')));
  v_nombre text := left(trim(coalesce(p->>'nombre', '')), 120);
  v_correo text := lower(trim(coalesce(p->>'correo', '')));
  v_tel text := regexp_replace(coalesce(p->>'telefono', ''), '\D', '', 'g');
  v_autoriza boolean := coalesce((p->>'autoriza')::boolean, false);
  v_alianza record; v_id uuid; v_existente boolean := false;
begin
  -- Campo trampa para bots: si viene lleno, se responde "ok" sin guardar nada
  if coalesce(trim(p->>'sitio_web'), '') <> '' then
    return jsonb_build_object('ok', true, 'leadId', null, 'enlace', null);
  end if;

  select * into v_alianza from public.alianza_enlaces where slug = v_slug and activo;
  if not found then raise exception 'Alianza no disponible'; end if;
  if v_nombre = '' then raise exception 'Falta el nombre'; end if;
  if length(v_tel) > 10 then v_tel := right(v_tel, 10); end if;
  if length(v_tel) <> 10 then raise exception 'Telefono invalido'; end if;
  if v_correo !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Correo invalido'; end if;
  if not v_autoriza then raise exception 'Falta la autorizacion de contacto'; end if;

  -- Freno global contra abuso (más de 40 altas nuevas en 10 minutos)
  if (select count(*) from public.leads where evento = 'alianza_directa' and contacto_autorizado_at > now() - interval '10 minutes') > 40 then
    raise exception 'Demasiadas solicitudes, intenta en unos minutos';
  end if;

  select id into v_id from public.leads where lower(trim(correo)) = v_correo order by created_at desc limit 1;
  if v_id is not null then
    v_existente := true;
    update public.leads set
      alianza_origen = v_slug, contacto_autorizado_at = now(),
      nombre_completo = coalesce(nullif(nombre_completo, ''), v_nombre),
      numero = coalesce(nullif(numero, ''), v_tel), updated_at = now()
    where id = v_id;
  else
    insert into public.leads (nombre_completo, numero, correo, constitucion, calificado, evento, alianza_origen, contacto_autorizado_at, utm_source, utm_medium, utm_campaign)
    values (v_nombre, v_tel, v_correo, '', false, 'alianza_directa', v_slug, now(),
            nullif(left(p->>'utm_source', 120), ''), nullif(left(p->>'utm_medium', 120), ''), nullif(left(p->>'utm_campaign', 120), ''))
    returning id into v_id;
  end if;

  if v_alianza.url_inicio is not null then
    update public.leads set alianza_enlace_entregado_at = now() where id = v_id;
  end if;

  perform public._avisar_registro_alianza(v_id, v_alianza.nombre, v_alianza.url_inicio is not null, v_existente);

  return jsonb_build_object('ok', true, 'leadId', v_id, 'enlace', v_alianza.url_inicio, 'alianza', v_alianza.nombre, 'existente', v_existente);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.registrar_lead_documentacion_directa(p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
  v_correo text := lower(trim(p->>'correo'));
  v_constitucion text := p->>'constitucion';
  v_envio jsonb;
begin
  if v_constitucion not in ('Persona Física con Actividad Empresarial', 'Persona Moral') then
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
  where lower(trim(correo)) = v_correo
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
    nombre_completo, numero, correo, constitucion, empresa, calificado, evento
  ) values (
    p->>'nombreCompleto', p->>'numero', p->>'correo', v_constitucion, nullif(p->>'empresa', ''),
    true, 'documentacion_directa'
  ) returning id into v_id;

  perform public._avisar_registro_documentacion(v_id);
  return jsonb_build_object('status', 'nuevo', 'leadId', v_id);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.resend_lead_link_email(p_lead_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- El reenvío del enlace personal sigue activo (decisión de Santiago, 2026-10-04); el interruptor
  -- correos_cliente_activos solo gobierna send_client_status_email (recibido / recordatorio).
  return public._resend_lead_link_email_impl(p_lead_id);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.save_ciec(p_lead_id uuid, p_ciec text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'vault', 'extensions'
AS $function$
declare
  v_key text;
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'ciec_encryption_key';
  if v_key is null then
    raise exception 'CIEC encryption key not configured';
  end if;
  update public.leads
    set ciec_encrypted = extensions.pgp_sym_encrypt(p_ciec, v_key),
        ciec_guardada_at = now(),
        ciec_purgada_at = null
    where id = p_lead_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.send_client_status_email(p_lead_id uuid, p_kind text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not coalesce((select correos_cliente_activos from public.site_config where id = 1), false) then
    return jsonb_build_object('sent', false, 'reason', 'desactivado_ghl');
  end if;
  return public._send_client_status_email_impl(p_lead_id, p_kind);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.send_lead_documentos_email(p_lead_id uuid, p_kind text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'vault', 'extensions'
AS $function$
declare
  v_resend_key text;
  v_storage_key text;
  v_ciec_key text;
  v_lead record;
  v_docs_rows text := '';
  v_ciec_plain text;
  v_resp extensions.http_response;
  v_html text;
  c_project_url constant text := 'https://pkfnmpdlrbpnlerttoaz.supabase.co';
  d record;
  v_signed_url text;
  v_sign_resp extensions.http_response;
  v_label text;
  v_banco text;
  v_resumen jsonb;
  v_subidos int;
  v_total int;
  v_pct int;
  v_faltan_html text;
  v_avance text;
  v_buro_rows text;
  v_color text;
  v_kicker text;
  v_title text;
  v_sub text;
  v_after text;
begin
  if p_kind not in ('completo', 'incompleto') then
    raise exception 'p_kind invalido: %', p_kind;
  end if;

  select * into v_lead from public.leads where id = p_lead_id;
  if not found then
    return jsonb_build_object('sent', false, 'reason', 'lead_not_found');
  end if;

  if p_kind = 'completo' and v_lead.documentos_email_enviado then
    return jsonb_build_object('sent', false, 'reason', 'already_sent');
  end if;
  if p_kind = 'incompleto' and v_lead.documentos_incompleto_email_enviado then
    return jsonb_build_object('sent', false, 'reason', 'already_sent');
  end if;

  select decrypted_secret into v_resend_key from vault.decrypted_secrets where name = 'resend_api_key';
  if v_resend_key is null then
    raise warning 'send_lead_documentos_email: resend_api_key no configurada, se omite envio';
    return jsonb_build_object('sent', false, 'reason', 'no_resend_key');
  end if;

  select decrypted_secret into v_storage_key from vault.decrypted_secrets where name = 'storage_service_role_key';
  select decrypted_secret into v_ciec_key from vault.decrypted_secrets where name = 'ciec_encryption_key';

  if v_lead.ciec_encrypted is not null and v_ciec_key is not null then
    begin
      v_ciec_plain := extensions.pgp_sym_decrypt(v_lead.ciec_encrypted, v_ciec_key);
    exception when others then
      v_ciec_plain := null;
    end;
  end if;

  -- Documentos (enlaces firmados de 7 días)
  for d in select * from public.lead_documentos where lead_id = p_lead_id order by tipo_documento, slot_index loop
    v_signed_url := null;
    if d.purgado_at is null and v_storage_key is not null then
      begin
        v_sign_resp := extensions.http((
          'POST',
          c_project_url || '/storage/v1/object/sign/lead-documentos/' || d.storage_path,
          ARRAY[
            extensions.http_header('Authorization', 'Bearer ' || v_storage_key),
            extensions.http_header('apikey', v_storage_key)
          ],
          'application/json',
          jsonb_build_object('expiresIn', 7*24*3600)::text
        )::extensions.http_request);
        if v_sign_resp.status between 200 and 299 then
          v_signed_url := c_project_url || '/storage/v1' || (v_sign_resp.content::jsonb ->> 'signedURL');
        end if;
      exception when others then
        v_signed_url := null;
      end;
    end if;

    v_label := public._document_label(d.tipo_documento, d.slot_index);
    if d.tipo_documento = 'estado_cuenta' then
      select nombre_banco into v_banco from public.lead_bancos where lead_id = p_lead_id and slot_index = d.slot_index / 10;
      v_label := 'Estado de cuenta ' || coalesce(nullif(v_banco, ''), 'banco ' || (d.slot_index / 10)) || ' — mes ' || (d.slot_index % 10);
    end if;

    v_docs_rows := v_docs_rows || public._team_row(
      public._esc(v_label),
      case
        when d.purgado_at is not null then '<span style="color:#9ca3af;font-weight:400">Eliminado (pasaron más de 7 días)</span>'
        when v_signed_url is not null then '<a href="' || v_signed_url || '" style="display:inline-block;padding:3px 12px;border:1px solid #006d4e;border-radius:999px;color:#006d4e;font-size:12px;font-weight:700;text-decoration:none">Ver archivo</a>'
        else '<span style="color:#9ca3af;font-weight:400">Enlace no disponible</span>'
      end
    );
  end loop;
  if v_docs_rows = '' then
    v_docs_rows := public._team_row('Documentos', 'Ninguno subido todavía');
  end if;

  if v_lead.constitucion = 'Persona Moral' then
    v_buro_rows := public._team_row('Buró empresa', public._esc(v_lead.buro_pm_empresa))
      || public._team_row('Detalle empresa', public._esc(v_lead.buro_pm_empresa_detalle))
      || public._team_row('Buró accionista', public._esc(v_lead.buro_pm_accionista))
      || public._team_row('Detalle accionista', public._esc(v_lead.buro_pm_accionista_detalle));
  else
    v_buro_rows := public._team_row('Buró PF', public._esc(v_lead.buro_pf))
      || public._team_row('Detalle', public._esc(v_lead.buro_pf_detalle));
  end if;

  -- Tarjeta de avance (número grande + barra + lista de faltantes)
  v_resumen := public._lead_resumen_documentos(p_lead_id);
  v_subidos := (v_resumen->>'subidos')::int;
  v_total := (v_resumen->>'total')::int;
  v_pct := case when v_total > 0 then round(100.0 * v_subidos / v_total)::int else 0 end;

  select coalesce(string_agg('&bull;&nbsp;' || public._esc(x), '<br>'), '') into v_faltan_html
    from jsonb_array_elements_text(v_resumen->'faltan') x;

  v_avance := '<tr><td colspan="2" style="padding:20px 0 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">'
    || '<tr><td bgcolor="#f6faf8" style="background-color:#f6faf8;border:1px solid #dcefe6;border-radius:10px;padding:18px 20px;font-family:Arial,Helvetica,sans-serif">'
    || '<span style="font-size:30px;font-weight:800;color:#006d4e;line-height:1">' || v_subidos || '</span>'
    || '<span style="font-size:14px;color:#6b7280"> de ' || v_total || ' documentos obligatorios</span>'
    || '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 0"><tr>'
    || case when v_pct > 0 then '<td width="' || v_pct || '%" height="8" bgcolor="#006d4e" style="background-color:#006d4e;border-radius:4px;font-size:1px;line-height:8px">&nbsp;</td>' else '' end
    || case when v_pct < 100 then '<td width="' || (100 - v_pct) || '%" height="8" bgcolor="#dfe5e2" style="background-color:#dfe5e2;border-radius:4px;font-size:1px;line-height:8px">&nbsp;</td>' else '' end
    || '</tr></table>'
    || case when v_faltan_html = ''
         then '<p style="margin:14px 0 0;font-size:13px;font-weight:700;color:#006d4e">Expediente completo ✅</p>'
         else '<p style="margin:14px 0 4px;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#b45309">Falta por subir</p>'
              || '<p style="margin:0;font-size:13px;line-height:1.7;color:#374151">' || v_faltan_html || '</p>'
       end
    || '</td></tr></table></td></tr>';

  -- Encabezado según tipo
  if p_kind = 'completo' then
    v_color := '#006d4e';
    v_kicker := 'Documentación completa';
    v_title := coalesce(public._esc(v_lead.nombre_completo), 'El lead') || ' terminó de subir su documentación';
    v_sub := 'Ya puedes revisar el expediente y continuar con la validación del trámite.';
    v_after := public._team_nota('#f0faf5', '#006d4e', '#14532d', '<strong>Siguiente paso:</strong> revisar la documentación y continuar con la validación del trámite.');
  else
    v_color := '#475569';
    v_kicker := 'Documentación incompleta · 30 min';
    v_title := coalesce(public._esc(v_lead.nombre_completo), 'El lead') || ' no terminó de subir su documentación';
    v_sub := 'Pasaron 30 minutos sin que la complete — contáctalo para ayudarlo a terminar.';
    v_after := public._team_nota('#f1f5f9', '#475569', '#334155', '<strong>Acción sugerida:</strong> contactar al lead para ayudarlo a terminar de subir su documentación.');
  end if;
  v_after := v_after || public._team_nota('#fffbeb', '#d97706', '#92400e',
    '<strong>Caducidad:</strong> los archivos se eliminan automáticamente a los 7 días de subirse (y los enlaces de este correo dejan de funcionar), y la CIEC a los 7 días de capturada. Descarga lo que necesites antes. Por seguridad, borra la CIEC de este correo al terminar el trámite.');

  v_html := public._team_email_shell(
    v_color, v_kicker, v_title, v_sub,
    public._team_acciones(v_lead.numero),
    v_avance
      || public._team_section('Contacto',
           public._team_row('Nombre', public._esc(v_lead.nombre_completo))
        || public._team_row('Teléfono', public._esc(v_lead.numero))
        || public._team_row('Correo', public._esc(v_lead.correo))
        || public._team_row('RFC', public._esc(v_lead.rfc))
        || public._team_row('Cargo', public._esc(v_lead.cargo))
        || public._team_row('Prefiere ser contactado', case v_lead.contacto_preferido when 'whatsapp' then 'Por WhatsApp' when 'llamada' then 'Por llamada' else null end
             || case when v_lead.contacto_preferido is not null then ' · ' || case v_lead.contacto_horario when 'manana' then 'en la mañana' when 'tarde' then 'en la tarde' else 'a cualquier hora' end else '' end))
      || public._team_section('Empresa',
           public._team_row('Constitución', public._esc(v_lead.constitucion))
        || public._team_row('Empresa', public._esc(v_lead.empresa))
        || public._team_row('Antigüedad', public._esc(v_lead.antiguedad))
        || public._team_row('Ingresos mensuales', public._esc(v_lead.ingresos))
        || public._team_row('Giro del negocio', public._esc(v_lead.giro)))
      || public._team_section('Solicitud',
           public._team_row('Monto', public._esc(v_lead.monto))
        || public._team_row('Destino', public._esc(v_lead.destino))
        || public._team_row('Garantía', public._esc(v_lead.garantia)))
      || public._team_section('Buró de crédito', v_buro_rows)
      || public._team_section('Acceso SAT',
           public._team_row('Clave CIEC',
             case when v_ciec_plain is not null
               then '<span style="font-family:Consolas,Courier New,monospace;background:#f3f4f6;padding:3px 10px;border-radius:4px">' || public._esc(v_ciec_plain) || '</span>'
               else '<span style="color:#b45309">No capturada</span>' end))
      || public._team_section('Documentos', v_docs_rows),
    v_after,
    'ID ' || v_lead.id || ' · ' || to_char(now() at time zone 'America/Mexico_City', 'DD/MM/YYYY HH24:MI')
  );

  v_resp := extensions.http((
    'POST',
    'https://api.resend.com/emails',
    ARRAY[extensions.http_header('Authorization', 'Bearer ' || v_resend_key)],
    'application/json',
    jsonb_build_object(
      'from', 'Firma 7 <notificaciones@firma7.com>',
      'to', jsonb_build_array('saruiz@socasesores.com'),
      'subject', case when p_kind='completo' then '📄 Documentación completa (' || v_subidos || '/' || v_total || ') — ' || coalesce(v_lead.nombre_completo, '')
                      else '✋ Lead incompleto (' || v_subidos || '/' || v_total || ') — ' || coalesce(v_lead.nombre_completo, '') end,
      'html', v_html
    )::text
  )::extensions.http_request);

  if v_resp.status between 200 and 299 then
    if p_kind = 'completo' then
      update public.leads set documentos_email_enviado = true, documentos_status = 'completo', documentos_completado_at = now() where id = p_lead_id;
    else
      update public.leads set documentos_incompleto_email_enviado = true where id = p_lead_id;
    end if;
    return jsonb_build_object('sent', true);
  else
    raise warning 'send_lead_documentos_email: fallo Resend (status %): %', v_resp.status, v_resp.content;
    return jsonb_build_object('sent', false, 'reason', 'resend_error', 'status', v_resp.status);
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.solicitar_codigo_lead(p_correo text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
begin
  select id into v_id
  from public.leads
  where lower(trim(correo)) = lower(trim(p_correo))
  order by created_at desc
  limit 1;

  if v_id is null or not public._lead_tiene_avance(v_id) then
    return jsonb_build_object('sent', false, 'reason', 'no_aplica');
  end if;
  return public._enviar_codigo_lead(v_id);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.submit_referido(p jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
  v_comentario text;
begin
  if coalesce(trim(p->>'referidoPorNombre'), '') = '' then
    raise exception 'Falta el nombre de quien refiere';
  end if;
  if coalesce(trim(p->>'referidoPorCorreo'), '') = '' then
    raise exception 'Falta el correo de quien refiere';
  end if;
  v_comentario := trim(p->>'comentario');
  if coalesce(v_comentario, '') = '' then
    raise exception 'Falta el comentario sobre el servicio';
  end if;
  if coalesce(trim(p->>'referido1Empresa'), '') = ''
     or coalesce(trim(p->>'referido1Contacto'), '') = ''
     or coalesce(trim(p->>'referido1Correo'), '') = ''
     or coalesce(trim(p->>'referido1Telefono'), '') = '' then
    raise exception 'Falta información del primer referido';
  end if;
  if coalesce(trim(p->>'referido2Empresa'), '') = ''
     or coalesce(trim(p->>'referido2Contacto'), '') = ''
     or coalesce(trim(p->>'referido2Correo'), '') = ''
     or coalesce(trim(p->>'referido2Telefono'), '') = '' then
    raise exception 'Falta información del segundo referido';
  end if;

  insert into public.referidos_clientes (
    referido_por_nombre, referido_por_empresa, referido_por_correo, referido_por_telefono, comentario,
    referido_1_empresa, referido_1_contacto, referido_1_correo, referido_1_telefono,
    referido_2_empresa, referido_2_contacto, referido_2_correo, referido_2_telefono,
    referido_3_empresa, referido_3_contacto, referido_3_correo, referido_3_telefono
  ) values (
    trim(p->>'referidoPorNombre'), nullif(trim(p->>'referidoPorEmpresa'), ''), trim(p->>'referidoPorCorreo'), nullif(trim(p->>'referidoPorTelefono'), ''), v_comentario,
    trim(p->>'referido1Empresa'), trim(p->>'referido1Contacto'), trim(p->>'referido1Correo'), trim(p->>'referido1Telefono'),
    trim(p->>'referido2Empresa'), trim(p->>'referido2Contacto'), trim(p->>'referido2Correo'), trim(p->>'referido2Telefono'),
    nullif(trim(p->>'referido3Empresa'), ''), nullif(trim(p->>'referido3Contacto'), ''),
    nullif(trim(p->>'referido3Correo'), ''), nullif(trim(p->>'referido3Telefono'), '')
  ) returning id into v_id;

  insert into public.testimonios (referido_id, nombre, empresa, comentario)
  values (v_id, trim(p->>'referidoPorNombre'), nullif(trim(p->>'referidoPorEmpresa'), ''), v_comentario);

  return v_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.submit_valoracion_lead(p_lead_id uuid, p_calificacion integer, p_comentario text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_lead record;
begin
  if p_calificacion not between 1 and 5 then raise exception 'calificacion invalida'; end if;
  select nombre_completo, empresa into v_lead from public.leads where id = p_lead_id;
  if not found then raise exception 'lead no encontrado'; end if;
  insert into public.testimonios (lead_id, nombre, empresa, comentario, calificacion)
  values (p_lead_id, coalesce(nullif(trim(v_lead.nombre_completo), ''), 'Cliente'), nullif(trim(v_lead.empresa), ''),
          left(coalesce(trim(p_comentario), ''), 500), p_calificacion)
  on conflict (lead_id) where lead_id is not null do update
    set calificacion = excluded.calificacion, comentario = excluded.comentario;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_lead_to_ghl()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'vault', 'extensions'
AS $function$
declare
  v_token text;
  v_location text;
  v_first_name text;
  v_last_name text;
  v_digits text;
  v_phone text;
  v_monto numeric;
  v_buro_empresa text;
  v_buro_accionista text;
  v_custom_fields jsonb;
  v_tags jsonb;
  v_body jsonb;
  v_contact_resp extensions.http_response;
  v_contact_json jsonb;
  v_contact_id text;
  v_search_resp extensions.http_response;
  v_search_json jsonb;
  v_opp_body jsonb;
  v_opp_resp extensions.http_response;
  c_pipeline_id constant text := 'A5H9ZRTzoPdSOQdwbsL2';
  c_stage_id constant text := '248f3bc8-30be-40f1-bd92-8181997bcf3d';
begin
  -- Los leads de "documentación directa" (clientes de Facebook ya perfilados
  -- por el equipo) ya existen como contacto en GHL de antemano — sincronizarlos
  -- aquí duplicaría/pisaría ese contacto sin necesidad.
  if new.evento = 'documentacion_directa' then
    return new;
  end if;

  select decrypted_secret into v_token from vault.decrypted_secrets where name = 'ghl_api_token';
  select decrypted_secret into v_location from vault.decrypted_secrets where name = 'ghl_location_id';

  if v_token is null or v_location is null then
    raise warning 'GHL: credenciales no configuradas en vault, se omite sincronizacion';
    return new;
  end if;

  begin
    v_first_name := split_part(trim(coalesce(new.nombre_completo, '')), ' ', 1);
    v_last_name := trim(substring(trim(coalesce(new.nombre_completo, '')) from length(v_first_name) + 1));

    v_digits := regexp_replace(coalesce(new.numero, ''), '\D', '', 'g');
    if length(v_digits) = 10 then
      v_phone := '+52' || v_digits;
    elsif length(v_digits) = 12 and left(v_digits, 2) = '52' then
      v_phone := '+' || v_digits;
    elsif v_digits <> '' then
      v_phone := '+' || v_digits;
    else
      v_phone := null;
    end if;

    v_monto := nullif(regexp_replace(coalesce(new.monto, ''), '\D', '', 'g'), '')::numeric;

    if new.constitucion = 'Persona Moral' then
      v_buro_empresa := trim(both ' ' from coalesce(new.buro_pm_empresa, '') ||
        case when new.buro_pm_empresa_detalle is not null and new.buro_pm_empresa_detalle <> ''
          then ' (' || new.buro_pm_empresa_detalle || ')' else '' end);
      v_buro_accionista := trim(both ' ' from coalesce(new.buro_pm_accionista, '') ||
        case when new.buro_pm_accionista_detalle is not null and new.buro_pm_accionista_detalle <> ''
          then ' (' || new.buro_pm_accionista_detalle || ')' else '' end);
    else
      v_buro_empresa := trim(both ' ' from coalesce(new.buro_pf, '') ||
        case when new.buro_pf_detalle is not null and new.buro_pf_detalle <> ''
          then ' (' || new.buro_pf_detalle || ')' else '' end);
      v_buro_accionista := '';
    end if;

    select jsonb_agg(jsonb_build_object('id', t.id, 'value', t.value))
    into v_custom_fields
    from (
      values
        ('0F0ndnNo0cumezA97XoK', new.constitucion),
        ('BGsSxXt5mILB33pynPMC', new.rfc),
        ('QFZa63IvVJihu8xE2rhN', new.cargo),
        ('bPoncGNnaP3WhrBFEV5e', new.antiguedad),
        ('mA8y8uFWOXXGVhhSXyaU', new.ingresos),
        ('mBri7MNhGBHTGXZLCF9g', new.destino),
        ('ws84Uls0nhnvqDERSelu', new.giro),
        ('er6ivTiCPXTGCLI6DRIf', new.garantia),
        ('hynpPTOFk4TpaOQBtFk7', nullif(v_buro_empresa, '')),
        ('7TqzwHAX5jGLUkPFyQYK', nullif(v_buro_accionista, ''))
    ) as t(id, value)
    where t.value is not null and t.value <> '';

    if v_monto is not null then
      v_custom_fields := coalesce(v_custom_fields, '[]'::jsonb)
        || jsonb_build_array(jsonb_build_object('id', '8p2yXRDNDjqcZGOq8aEt', 'value', v_monto));
    end if;

    -- Tags de atribución: se agregan como tags (no custom fields, no requieren
    -- IDs de GHL) para poder segmentar/filtrar leads por campaña dentro de GHL.
    v_tags := jsonb_build_array(case when new.evento = 'alianza_directa' then 'lead-alianza' else 'lead-perfilamiento-web' end);
    if nullif(new.alianza_origen, '') is not null then
      v_tags := v_tags || jsonb_build_array('alianza:' || new.alianza_origen);
    end if;
    if nullif(new.utm_source, '') is not null then
      v_tags := v_tags || jsonb_build_array('utm_source:' || new.utm_source);
    end if;
    if nullif(new.utm_campaign, '') is not null then
      v_tags := v_tags || jsonb_build_array('utm_campaign:' || new.utm_campaign);
    end if;
    if nullif(new.utm_medium, '') is not null then
      v_tags := v_tags || jsonb_build_array('utm_medium:' || new.utm_medium);
    end if;

    v_body := jsonb_strip_nulls(jsonb_build_object(
      'locationId', v_location,
      'firstName', nullif(v_first_name, ''),
      'lastName', nullif(v_last_name, ''),
      'email', new.correo,
      'phone', v_phone,
      'tags', v_tags,
      'customFields', coalesce(v_custom_fields, '[]'::jsonb)
    ));

    -- 1) Crear/actualizar contacto
    v_contact_resp := extensions.http((
      'POST',
      'https://services.leadconnectorhq.com/contacts/upsert',
      ARRAY[
        extensions.http_header('Authorization', 'Bearer ' || v_token),
        extensions.http_header('Version', '2021-07-28')
      ],
      'application/json',
      v_body::text
    )::extensions.http_request);

    v_contact_json := v_contact_resp.content::jsonb;
    v_contact_id := v_contact_json #>> '{contact,id}';

    if v_contact_resp.status not between 200 and 299 or v_contact_id is null then
      raise warning 'GHL: fallo upsert de contacto (status %): %', v_contact_resp.status, v_contact_resp.content;
      return new;
    end if;

    -- 2) Ver si ya existe una oportunidad de este contacto en el pipeline
    v_search_resp := extensions.http((
      'GET',
      'https://services.leadconnectorhq.com/opportunities/search'
        || '?location_id=' || v_location
        || '&pipeline_id=' || c_pipeline_id
        || '&contact_id=' || v_contact_id,
      ARRAY[
        extensions.http_header('Authorization', 'Bearer ' || v_token),
        extensions.http_header('Version', '2021-07-28')
      ],
      null,
      null
    )::extensions.http_request);
    v_search_json := v_search_resp.content::jsonb;

    -- 3) Crear la oportunidad solo si no existe ya una en este pipeline
    if v_search_resp.status between 200 and 299
       and coalesce((v_search_json -> 'meta' ->> 'total')::int, 0) = 0 then
      v_opp_body := jsonb_build_object(
        'pipelineId', c_pipeline_id,
        'locationId', v_location,
        'contactId', v_contact_id,
        'name', coalesce(nullif(trim(new.nombre_completo), ''), 'Lead sin nombre'),
        'pipelineStageId', c_stage_id,
        'status', 'open',
        'monetaryValue', v_monto
      );

      v_opp_resp := extensions.http((
        'POST',
        'https://services.leadconnectorhq.com/opportunities/',
        ARRAY[
          extensions.http_header('Authorization', 'Bearer ' || v_token),
          extensions.http_header('Version', '2021-07-28')
        ],
        'application/json',
        v_opp_body::text
      )::extensions.http_request);

      if v_opp_resp.status not between 200 and 299 then
        raise warning 'GHL: fallo al crear oportunidad (status %): %', v_opp_resp.status, v_opp_resp.content;
      end if;
    end if;

  exception when others then
    raise warning 'GHL: error en sincronizacion de lead: %', sqlerrm;
  end;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.testimonio_por_token(p_token uuid)
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select to_jsonb(x) from (
    select nombre, empresa, comentario, calificacion, aprobado, autoriza_publicar
    from public.testimonios where aprobar_token = p_token
  ) x;
$function$
;

CREATE OR REPLACE FUNCTION public.verificar_codigo_lead(p_correo text, p_codigo text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_lead public.leads;
  v_cod public.lead_codigos_acceso;
begin
  select * into v_lead
  from public.leads
  where lower(trim(correo)) = lower(trim(p_correo))
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
      'tipo', case when v_lead.constitucion = 'Persona Moral' then 'moral' else 'fisica' end
    );
  end if;

  update public.lead_codigos_acceso set intentos = intentos + 1 where id = v_cod.id;
  return jsonb_build_object('ok', false, 'reason', 'invalido', 'intentosRestantes', greatest(0, 4 - v_cod.intentos));
end;
$function$
;


-- ─── 3. Triggers ────────────────────────────────────────────────────────────

drop trigger if exists trg_notify_referido_inserted on public.referidos_clientes;
create trigger trg_notify_referido_inserted after insert or update on public.referidos_clientes
  for each row execute function public.notify_referido_inserted();

-- GHL recibe los leads calificados y los de alianza
drop trigger if exists trg_sync_lead_to_ghl on public.leads;
create trigger trg_sync_lead_to_ghl after insert or update on public.leads
  for each row when (new.calificado is true or new.evento = 'alianza_directa')
  execute function public.sync_lead_to_ghl();


-- ─── 4. Permisos (anon / authenticated) ─────────────────────────────────────
-- Las funciones internas (_*) no son ejecutables por anon/authenticated; las RPC
-- que llama el sitio sí lo son (el leadId / token actúa como credencial).

revoke all on function public._avisar_opinion_gracias(p_id uuid) from public, anon, authenticated;
revoke all on function public._avisar_referidos_gracias(p_id uuid) from public, anon, authenticated;
revoke all on function public._avisar_registro_alianza(p_lead uuid, p_alianza text, p_enlace boolean, p_existente boolean) from public, anon, authenticated;
revoke all on function public._avisar_registro_documentacion(p_lead_id uuid) from public, anon, authenticated;
revoke all on function public._client_email_shell(p_icon text, p_header_from text, p_header_to text, p_title text, p_first_name text, p_body_html text, p_cta_url text, p_cta_label text) from public, anon, authenticated;
grant execute on function public._client_email_shell(p_icon text, p_header_from text, p_header_to text, p_title text, p_first_name text, p_body_html text, p_cta_url text, p_cta_label text) to anon;
grant execute on function public._client_email_shell(p_icon text, p_header_from text, p_header_to text, p_title text, p_first_name text, p_body_html text, p_cta_url text, p_cta_label text) to authenticated;
revoke all on function public._client_email_shell(p_kicker text, p_title text, p_first_name text, p_body_html text, p_cta_url text, p_cta_label text) from public, anon, authenticated;
grant execute on function public._client_email_shell(p_kicker text, p_title text, p_first_name text, p_body_html text, p_cta_url text, p_cta_label text) to anon;
grant execute on function public._client_email_shell(p_kicker text, p_title text, p_first_name text, p_body_html text, p_cta_url text, p_cta_label text) to authenticated;
revoke all on function public._correo_opinion_gracias(p_id uuid) from public, anon, authenticated;
revoke all on function public._correo_referidos_gracias(p_id uuid) from public, anon, authenticated;
revoke all on function public._document_label(p_tipo text, p_slot integer) from public, anon, authenticated;
revoke all on function public._enviar_codigo_lead(p_lead_id uuid) from public, anon, authenticated;
revoke all on function public._enviar_correo_equipo(p_subject text, p_html text) from public, anon, authenticated;
revoke all on function public._esc(p text) from public, anon, authenticated;
revoke all on function public._lead_resumen_documentos(p_lead_id uuid) from public, anon, authenticated;
revoke all on function public._lead_tiene_avance(p_lead_id uuid) from public, anon, authenticated;
revoke all on function public._resend_lead_link_email_impl(p_lead_id uuid) from public, anon, authenticated;
revoke all on function public._send_client_status_email_impl(p_lead_id uuid, p_kind text) from public, anon, authenticated;
revoke all on function public._team_acciones(p_numero text) from public, anon, authenticated;
revoke all on function public._team_acciones_extra(p_numero text, p_url text, p_label text, p_bg text) from public, anon, authenticated;
revoke all on function public._team_btn(p_url text, p_label text, p_bg text) from public, anon, authenticated;
revoke all on function public._team_email_shell(p_color text, p_kicker text, p_title text, p_subtitle text, p_acciones text, p_content text, p_after text, p_footer text) from public, anon, authenticated;
revoke all on function public._team_nota(p_bg text, p_borde text, p_color text, p_html text) from public, anon, authenticated;
revoke all on function public._team_row(p_label text, p_value text) from public, anon, authenticated;
revoke all on function public._team_section(p_title text, p_rows text) from public, anon, authenticated;
revoke all on function public.admin_list_referidos_gracias_items(p_passcode text) from public, anon, authenticated;
grant execute on function public.admin_list_referidos_gracias_items(p_passcode text) to anon;
grant execute on function public.admin_list_referidos_gracias_items(p_passcode text) to authenticated;
revoke all on function public.admin_set_testimonio_aprobado(p_passcode text, p_id uuid, p_aprobado boolean, p_orden integer) from public, anon, authenticated;
grant execute on function public.admin_set_testimonio_aprobado(p_passcode text, p_id uuid, p_aprobado boolean, p_orden integer) to anon;
grant execute on function public.admin_set_testimonio_aprobado(p_passcode text, p_id uuid, p_aprobado boolean, p_orden integer) to authenticated;
revoke all on function public.agregar_referidos_gracias(p_id uuid, p jsonb) from public, anon, authenticated;
grant execute on function public.agregar_referidos_gracias(p_id uuid, p jsonb) to anon;
grant execute on function public.agregar_referidos_gracias(p_id uuid, p jsonb) to authenticated;
revoke all on function public.decidir_testimonio_por_token(p_token uuid, p_publicar boolean) from public, anon, authenticated;
grant execute on function public.decidir_testimonio_por_token(p_token uuid, p_publicar boolean) to anon;
grant execute on function public.decidir_testimonio_por_token(p_token uuid, p_publicar boolean) to authenticated;
revoke all on function public.delete_lead_accionista(p_lead_id uuid, p_slot_index smallint) from public, anon, authenticated;
grant execute on function public.delete_lead_accionista(p_lead_id uuid, p_slot_index smallint) to anon;
grant execute on function public.delete_lead_accionista(p_lead_id uuid, p_slot_index smallint) to authenticated;
revoke all on function public.get_lead_progreso(p_lead_id uuid) from public, anon, authenticated;
grant execute on function public.get_lead_progreso(p_lead_id uuid) to anon;
grant execute on function public.get_lead_progreso(p_lead_id uuid) to authenticated;
revoke all on function public.guardar_opinion_gracias(p jsonb) from public, anon, authenticated;
grant execute on function public.guardar_opinion_gracias(p jsonb) to anon;
grant execute on function public.guardar_opinion_gracias(p jsonb) to authenticated;
revoke all on function public.guardar_preferencia_contacto(p_lead_id uuid, p_canal text, p_horario text) from public, anon, authenticated;
grant execute on function public.guardar_preferencia_contacto(p_lead_id uuid, p_canal text, p_horario text) to anon;
grant execute on function public.guardar_preferencia_contacto(p_lead_id uuid, p_canal text, p_horario text) to authenticated;
revoke all on function public.notify_lead_inserted() from public, anon, authenticated;
grant execute on function public.notify_lead_inserted() to anon;
grant execute on function public.notify_lead_inserted() to authenticated;
revoke all on function public.notify_referido_inserted() from public, anon, authenticated;
grant execute on function public.notify_referido_inserted() to anon;
grant execute on function public.notify_referido_inserted() to authenticated;
revoke all on function public.purge_expired_lead_documentos() from public, anon, authenticated;
revoke all on function public.record_document_upload(p_lead_id uuid, p_tipo_documento text, p_slot_index smallint, p_storage_path text, p_file_name text, p_file_size_bytes integer, p_mime_type text) from public, anon, authenticated;
grant execute on function public.record_document_upload(p_lead_id uuid, p_tipo_documento text, p_slot_index smallint, p_storage_path text, p_file_name text, p_file_size_bytes integer, p_mime_type text) to anon;
grant execute on function public.record_document_upload(p_lead_id uuid, p_tipo_documento text, p_slot_index smallint, p_storage_path text, p_file_name text, p_file_size_bytes integer, p_mime_type text) to authenticated;
revoke all on function public.registrar_lead_alianza(p jsonb) from public, anon, authenticated;
grant execute on function public.registrar_lead_alianza(p jsonb) to anon;
grant execute on function public.registrar_lead_alianza(p jsonb) to authenticated;
revoke all on function public.registrar_lead_documentacion_directa(p jsonb) from public, anon, authenticated;
grant execute on function public.registrar_lead_documentacion_directa(p jsonb) to anon;
grant execute on function public.registrar_lead_documentacion_directa(p jsonb) to authenticated;
revoke all on function public.resend_lead_link_email(p_lead_id uuid) from public, anon, authenticated;
grant execute on function public.resend_lead_link_email(p_lead_id uuid) to anon;
grant execute on function public.resend_lead_link_email(p_lead_id uuid) to authenticated;
revoke all on function public.save_ciec(p_lead_id uuid, p_ciec text) from public, anon, authenticated;
grant execute on function public.save_ciec(p_lead_id uuid, p_ciec text) to anon;
grant execute on function public.save_ciec(p_lead_id uuid, p_ciec text) to authenticated;
revoke all on function public.send_client_status_email(p_lead_id uuid, p_kind text) from public, anon, authenticated;
grant execute on function public.send_client_status_email(p_lead_id uuid, p_kind text) to anon;
grant execute on function public.send_client_status_email(p_lead_id uuid, p_kind text) to authenticated;
revoke all on function public.send_lead_documentos_email(p_lead_id uuid, p_kind text) from public, anon, authenticated;
grant execute on function public.send_lead_documentos_email(p_lead_id uuid, p_kind text) to anon;
grant execute on function public.send_lead_documentos_email(p_lead_id uuid, p_kind text) to authenticated;
revoke all on function public.solicitar_codigo_lead(p_correo text) from public, anon, authenticated;
grant execute on function public.solicitar_codigo_lead(p_correo text) to anon;
grant execute on function public.solicitar_codigo_lead(p_correo text) to authenticated;
revoke all on function public.submit_referido(p jsonb) from public, anon, authenticated;
grant execute on function public.submit_referido(p jsonb) to anon;
grant execute on function public.submit_referido(p jsonb) to authenticated;
revoke all on function public.submit_valoracion_lead(p_lead_id uuid, p_calificacion integer, p_comentario text) from public, anon, authenticated;
grant execute on function public.submit_valoracion_lead(p_lead_id uuid, p_calificacion integer, p_comentario text) to anon;
grant execute on function public.submit_valoracion_lead(p_lead_id uuid, p_calificacion integer, p_comentario text) to authenticated;
revoke all on function public.sync_lead_to_ghl() from public, anon, authenticated;
grant execute on function public.sync_lead_to_ghl() to anon;
grant execute on function public.sync_lead_to_ghl() to authenticated;
revoke all on function public.testimonio_por_token(p_token uuid) from public, anon, authenticated;
grant execute on function public.testimonio_por_token(p_token uuid) to anon;
grant execute on function public.testimonio_por_token(p_token uuid) to authenticated;
revoke all on function public.verificar_codigo_lead(p_correo text, p_codigo text) from public, anon, authenticated;
grant execute on function public.verificar_codigo_lead(p_correo text, p_codigo text) to anon;
grant execute on function public.verificar_codigo_lead(p_correo text, p_codigo text) to authenticated;
