-- Portal de Alianzas: tabla de invitaciones
create table if not exists public.alianza_invitations (
  id               uuid primary key default gen_random_uuid(),
  email            text not null unique,
  nombre_empresa   text not null,
  logo_url         text,
  ejecutivo_asignado text,
  status           text not null default 'active' check (status in ('active', 'inactive', 'revoked')),
  invited_by       uuid references auth.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Solo lectura para usuarios autenticados (leen su propio registro)
alter table public.alianza_invitations enable row level security;

create policy "Alianza can read own invite"
  on public.alianza_invitations
  for select
  using (email = auth.email());

-- Admins (service_role) pueden gestionar todas las invitaciones desde el backend
-- No se expone política de insert/update/delete al anon key por seguridad
