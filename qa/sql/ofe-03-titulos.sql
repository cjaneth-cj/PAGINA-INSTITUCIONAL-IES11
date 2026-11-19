-- ============================================================================
-- OFE-03: normalización de nombres de carreras y títulos otorgados
-- ----------------------------------------------------------------------------
-- Proyecto: PAGINA-INSTITUCIONAL-IES11
-- Rama:     qa/ofe-03-titulos
--
-- Objetivo:
--   Que la escritura de `carreras.nombre` y `carreras.titulo_otorgado` sea
--   siempre la misma, sin importar cómo se haya tipeado en el panel.
--
-- Reglas aplicadas (idénticas a js/titulos.js):
--   1. Se recortan y colapsan los espacios.
--   2. Se corrigen errores de tipeo y tildes faltantes conocidos.
--   3. Capitalización tipo título: mayúscula inicial, conectores en minúscula.
--   4. Las siglas habituales quedan en mayúsculas.
--
-- IMPORTANTE:
--   * No cambia denominaciones académicas: solo su escritura.
--   * "COCINA REGIONALES" -> "Cocina Regional" es una corrección gramatical
--     que debe confirmarse con la institución.
--   * Es idempotente: se puede ejecutar más de una vez.
--   * Ejecutar en el SQL Editor de Supabase con rol administrador.
--   * Hacer backup del esquema antes de ejecutar.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- Función de normalización
-- ----------------------------------------------------------------------------
create or replace function public.normalizar_denominacion(p_texto text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  v_texto     text;
  v_resultado text := '';
  v_palabra   text;
  v_pos       integer := 0;
  v_par       record;
begin
  if p_texto is null then
    return null;
  end if;

  v_texto := lower(regexp_replace(btrim(p_texto), '\s+', ' ', 'g'));

  if v_texto = '' then
    return '';
  end if;

  -- Correcciones de concordancia entre palabras.
  -- Mantener sincronizado con FRASES en js/titulos.js.
  v_texto := regexp_replace(
    v_texto,
    '\menerg[ií]a renovables\M',
    'energías renovables',
    'g'
  );

  -- Correcciones puntuales de tipeo / tildes.
  -- Mantener sincronizado con CORRECCIONES en js/titulos.js.
  for v_par in
    select *
      from (values
        ('adminitracion',  'administración'),
        ('desarrolo',      'desarrollo'),
        ('superios',       'superior'),
        ('gerentologia',   'gerontología'),
        ('regionales',     'regional'),
        ('administracion', 'administración'),
        ('tecnico',        'técnico'),
        ('tecnica',        'técnica'),
        ('gestion',        'gestión'),
        ('energia',        'energía'),
        ('energias',       'energías'),
        ('hoteleria',      'hotelería'),
        ('enfermeria',     'enfermería'),
        ('diseno',         'diseño'),
        ('gerontologia',   'gerontología'),
        ('electronica',    'electrónica'),
        ('mecanica',       'mecánica'),
        ('quimica',        'química'),
        ('fisica',         'física'),
        ('matematicas',    'matemáticas'),
        ('robotica',       'robótica'),
        ('analisis',       'análisis'),
        ('practica',       'práctica'),
        ('practicas',      'prácticas'),
        ('programacion',   'programación'),
        ('automatizacion', 'automatización')
      ) as t(incorrecta, correcta)
  loop
    v_texto := regexp_replace(
      v_texto,
      '\m' || v_par.incorrecta || '\M',
      v_par.correcta,
      'g'
    );
  end loop;

  -- Capitalización palabra por palabra.
  foreach v_palabra in array regexp_split_to_array(v_texto, ' ') loop
    v_pos := v_pos + 1;

    if v_pos > 1 and v_palabra = any (array[
      'de', 'del', 'la', 'las', 'los', 'el',
      'y', 'e', 'en', 'con', 'para', 'por',
      'a', 'al', 'o', 'u',
      'un', 'una', 'unos', 'unas'
    ]) then
      v_resultado := v_resultado || ' ' || v_palabra;

    elsif v_palabra = any (array['ia', 'tic', 'tics', 'ong', 'pyme', 'pymes']) then
      v_resultado := v_resultado || ' ' || upper(v_palabra);

    else
      v_resultado := v_resultado
        || ' '
        || upper(substr(v_palabra, 1, 1))
        || substr(v_palabra, 2);
    end if;
  end loop;

  return btrim(v_resultado);
end;
$$;

comment on function public.normalizar_denominacion(text) is
  'OFE-03: unifica la escritura de nombres y títulos (mayúscula inicial, conectores en minúscula, tildes conocidas).';

-- ----------------------------------------------------------------------------
-- Trigger: se aplica en cada alta o edición desde el panel
-- ----------------------------------------------------------------------------
create or replace function public.carreras_normalizar_denominacion()
returns trigger
language plpgsql
as $$
begin
  new.nombre := public.normalizar_denominacion(new.nombre);
  new.titulo_otorgado := public.normalizar_denominacion(new.titulo_otorgado);
  return new;
end;
$$;

drop trigger if exists trg_carreras_normalizar_denominacion on public.carreras;

create trigger trg_carreras_normalizar_denominacion
before insert or update of nombre, titulo_otorgado on public.carreras
for each row
execute function public.carreras_normalizar_denominacion();

-- ----------------------------------------------------------------------------
-- Corrección de los registros existentes
-- ----------------------------------------------------------------------------
update public.carreras
   set nombre = public.normalizar_denominacion(nombre),
       titulo_otorgado = public.normalizar_denominacion(titulo_otorgado);

commit;

-- ============================================================================
-- VERIFICACIÓN
-- ----------------------------------------------------------------------------
-- select id, nombre, titulo_otorgado
--   from public.carreras
--  order by nombre;
--
-- Resultado esperado (entre otros):
--   Administración de la Salud       | Administración de la Salud
--   Agente Sanitario                 | Agente Sanitario
--   Cocina Regional                  | Cocinero
--   Desarrollo de Software           | Técnico Superior en Desarrollo de Software
--   Enfermería                       | Enfermero/a
--   Gerontología                     | Técnico Superior en Gerontología
--   Gestión de Energía Renovables    | Técnico Superior en Gestión de Energía Renovables
--   Higiene y Seguridad              | Técnico Superior en Higiene y Seguridad
--   Hotelería                        | Hotelería
--   Laboratorio                      | Laboratorio
-- ============================================================================
