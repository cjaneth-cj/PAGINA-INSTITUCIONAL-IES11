-- ============================================================================
-- Endurecimiento de Row Level Security (RLS) — Proyecto IES N° 11
-- ----------------------------------------------------------------------------
-- IMPORTANTE:
--   * Probar primero en un proyecto/entorno de STAGING.
--   * Revisar que los nombres de tablas coincidan con el esquema real.
--   * Este script NO borra datos; cambia permisos y políticas.
--   * Ejecutar en el SQL Editor de Supabase (rol postgres/service_role).
--   * Antes de aplicarlo, exportar un backup del esquema y de las políticas.
--
-- Objetivo:
--   1. Lectura pública SOLO del contenido institucional.
--   2. Inserción pública SOLO en el formulario de contacto.
--   3. Escritura administrativa SOLO para usuarios con app_metadata.role = 'admin'.
--   4. Bloquear lectura de datos personales (mensajes_contacto) a anónimos.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 0) Función auxiliar: ¿el usuario autenticado es administrador?
--    El rol se guarda en auth.users.raw_app_meta_data->>'role' (no editable por
--    el propio usuario). Asignarlo con la Admin API o desde el Dashboard:
--
--    update auth.users
--       set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
--                               || '{"role":"admin"}'::jsonb
--     where email = 'admin@ies11jujuy.edu.ar';
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ----------------------------------------------------------------------------
-- 1) Habilitar RLS en todas las tablas expuestas por la API
-- ----------------------------------------------------------------------------
alter table public.carreras            enable row level security;
alter table public.noticias            enable row level security;
alter table public.agenda              enable row level security;
alter table public.mensajes_contacto   enable row level security;

-- Si existen en tu esquema, descomentar:
-- alter table public.solicitudes_estudiantes enable row level security;
-- alter table public.calendario_examenes     enable row level security;

-- ----------------------------------------------------------------------------
-- 2) Revocar privilegios directos del rol anónimo (segunda capa de defensa)
-- ----------------------------------------------------------------------------
revoke insert, update, delete on public.carreras          from anon;
revoke insert, update, delete on public.noticias          from anon;
revoke insert, update, delete on public.agenda            from anon;
revoke select, update, delete on public.mensajes_contacto from anon;

-- El formulario público necesita insertar consultas:
grant insert on public.mensajes_contacto to anon;

-- ----------------------------------------------------------------------------
-- 3) Políticas: contenido institucional (lectura pública, escritura admin)
-- ----------------------------------------------------------------------------
drop policy if exists "carreras_lectura_publica" on public.carreras;
create policy "carreras_lectura_publica"
  on public.carreras for select
  to anon, authenticated
  using (true);

drop policy if exists "carreras_admin_total" on public.carreras;
create policy "carreras_admin_total"
  on public.carreras for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "noticias_lectura_publica" on public.noticias;
create policy "noticias_lectura_publica"
  on public.noticias for select
  to anon, authenticated
  using (true);

drop policy if exists "noticias_admin_total" on public.noticias;
create policy "noticias_admin_total"
  on public.noticias for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "agenda_lectura_publica" on public.agenda;
create policy "agenda_lectura_publica"
  on public.agenda for select
  to anon, authenticated
  using (true);

drop policy if exists "agenda_admin_total" on public.agenda;
create policy "agenda_admin_total"
  on public.agenda for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 4) Mensajes de contacto:
--    - anónimo: solo INSERT con validación básica (anti-abuso).
--    - anónimo: SIN SELECT/UPDATE/DELETE.
--    - admin: lectura y gestión total.
-- ----------------------------------------------------------------------------
drop policy if exists "contacto_insert_publico" on public.mensajes_contacto;
create policy "contacto_insert_publico"
  on public.mensajes_contacto for insert
  to anon, authenticated
  with check (
    char_length(btrim(coalesce(nombre, '')))  between 1 and 120
    and char_length(btrim(coalesce(email, ''))) between 5 and 254
    and btrim(coalesce(email, '')) ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    and char_length(btrim(coalesce(asunto, '')))  between 1 and 200
    and char_length(btrim(coalesce(mensaje, ''))) between 1 and 5000
    and leido = false
  );

drop policy if exists "contacto_admin_total" on public.mensajes_contacto;
create policy "contacto_admin_total"
  on public.mensajes_contacto for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 5) Storage: bucket "archivos"
--    Lectura pública de imágenes/PDF; escritura solo administradores.
-- ----------------------------------------------------------------------------
drop policy if exists "archivos_lectura_publica" on storage.objects;
create policy "archivos_lectura_publica"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'archivos');

drop policy if exists "archivos_admin_insert" on storage.objects;
create policy "archivos_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'archivos' and public.is_admin());

drop policy if exists "archivos_admin_update" on storage.objects;
create policy "archivos_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'archivos' and public.is_admin())
  with check (bucket_id = 'archivos' and public.is_admin());

drop policy if exists "archivos_admin_delete" on storage.objects;
create policy "archivos_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'archivos' and public.is_admin());

commit;

-- ============================================================================
-- VERIFICACIÓN POST-APLICACIÓN
-- ----------------------------------------------------------------------------
-- 1) RLS habilitado en todas las tablas:
--    select schemaname, tablename, rowsecurity
--      from pg_tables
--     where schemaname = 'public'
--     order by tablename;
--
-- 2) Políticas creadas:
--    select tablename, policyname, roles, cmd, qual, with_check
--      from pg_policies
--     where schemaname = 'public'
--     order by tablename, policyname;
--
-- 3) Prueba anónima (debe devolver 401/403 o []):
--    curl -s ".../rest/v1/mensajes_contacto?select=id&limit=1" \
--      -H "apikey: <ANON_KEY>"
--
--    curl -s -X PATCH ".../rest/v1/carreras?id=eq.-1" \
--      -H "apikey: <ANON_KEY>" -H "Content-Type: application/json" \
--      -d '{"nombre":"x"}'
--
-- 4) Prueba autenticada como admin: debe permitir lectura/escritura.
-- ============================================================================
