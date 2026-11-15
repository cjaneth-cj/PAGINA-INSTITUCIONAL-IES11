-- ============================================================================
-- Migración de columnas para los tickets DASH-02 y OFE-04
-- ----------------------------------------------------------------------------
-- Proyecto: PAGINA-INSTITUCIONAL-IES11
-- Rama:     qa/auditoria-seguridad
--
-- Aplica:
--   DASH-02  estado / responsable / respuesta / respondido_at en mensajes_contacto
--   OFE-04   turno en carreras
--
-- IMPORTANTE:
--   * Ejecutar en el SQL Editor de Supabase con un rol administrador.
--   * Es idempotente: se puede correr más de una vez.
--   * No borra datos.
--   * Antes de ejecutar, hacer un backup del esquema.
--   * Este script NO modifica las políticas RLS. Revisar también
--     qa/sql/hardening-rls.sql (hallazgo SEC-01).
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- DASH-02: ciclo de vida de las consultas
-- ----------------------------------------------------------------------------
alter table public.mensajes_contacto
  add column if not exists estado text,
  add column if not exists responsable text,
  add column if not exists respuesta text,
  add column if not exists respondido_at timestamptz;

-- Backfill: las consultas existentes parten del booleano leido
update public.mensajes_contacto
   set estado = case when leido then 'Leído' else 'Nuevo' end
 where estado is null;

alter table public.mensajes_contacto
  alter column estado set default 'Nuevo';

-- Validación del dominio de estados
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'mensajes_contacto_estado_check'
       and conrelid = 'public.mensajes_contacto'::regclass
  ) then
    alter table public.mensajes_contacto
      add constraint mensajes_contacto_estado_check
      check (estado in ('Nuevo', 'Leído', 'Pendiente de respuesta', 'Respondido', 'Finalizado'));
  end if;
end $$;

-- Recién después del backfill se puede exigir NOT NULL
alter table public.mensajes_contacto
  alter column estado set not null;

create index if not exists idx_mensajes_contacto_estado
  on public.mensajes_contacto (estado);

comment on column public.mensajes_contacto.estado is
  'Estado del ciclo de atención: Nuevo, Leído, Pendiente de respuesta, Respondido, Finalizado.';
comment on column public.mensajes_contacto.responsable is
  'Email del usuario administrativo que atendió la consulta.';
comment on column public.mensajes_contacto.respuesta is
  'Resumen interno de la respuesta enviada al remitente.';
comment on column public.mensajes_contacto.respondido_at is
  'Fecha y hora en que se registró la respuesta o el cierre.';

-- ----------------------------------------------------------------------------
-- OFE-04: turno de cursado de cada carrera
-- ----------------------------------------------------------------------------
alter table public.carreras
  add column if not exists turno text;

comment on column public.carreras.turno is
  'Turno de cursado informado al estudiante: Mañana, Tarde, Vespertino / Noche, combinaciones o NULL = A confirmar.';

commit;

-- ============================================================================
-- VERIFICACIÓN
-- ----------------------------------------------------------------------------
-- select id, nombre, email, estado, responsable, respondido_at
--   from public.mensajes_contacto
--  order by created_at desc
--  limit 10;
--
-- select id, nombre, turno from public.carreras order by id limit 10;
--
-- select conname, pg_get_constraintdef(oid)
--   from pg_constraint
--  where conrelid = 'public.mensajes_contacto'::regclass;
-- ============================================================================
