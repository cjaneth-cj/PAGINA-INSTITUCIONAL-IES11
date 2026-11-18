# OFE-05 — Revisión integral de denominaciones

Fecha: 18/11/2026 · Rama: `qa/ofe-05-revision-titulos` · Base: `main` (`9370766`)

## Alcance

Revisión de los 13 registros de `public.carreras` (nombres y títulos otorgados) para verificar ortografía, tildes, capitalización y concordancia, manteniendo la denominación académica de cada carrera.

## Criterio

- Se corrige **escritura**, no la denominación: no se agregan ni quitan palabras académicas.
- Capitalización tipo título: mayúscula inicial y conectores (`de`, `en`, `y`, `e`, …) en minúscula.
- Siglas en mayúscula (`IA`, `TIC`).
- Donde no hay denominación oficial confirmada, se respeta el texto cargado y se marca la consulta.

## Resultado por carrera

| # | Nombre en base | Nombre que se muestra | Título en base | Título que se muestra | Estado |
|---|---|---|---|---|---|
| 1 | `TECNICATURA SUPERIOR EN TURISMO` | Tecnicatura Superior en Turismo | `Técnico Superior en Turismo` | Técnico Superior en Turismo | Correcto |
| 2 | `ENFERMERIA` | Enfermería | `Enfermero/a` | Enfermero/a | Confirmar denominación oficial |
| 3 | `CIENCIA DE DATOS E INTELIGENCIA ARTIFICIAL` | Ciencia de Datos e Inteligencia Artificial | `Técnico Superior en Ciencia de Datos e Inteligencia Artificial` | Técnico Superior en Ciencia de Datos e Inteligencia Artificial | Correcto |
| 4 | `LABORATORIO` | Laboratorio | `LABORATORIO` | Laboratorio | Confirmar título oficial |
| 5 | `HOTELERIA` | Hotelería | `Hoteleria` | Hotelería | Confirmar título oficial |
| 6 | `HIGIENE Y SEGURIDAD` | Higiene y Seguridad | `Tecnico superior en Higiene y seguridad` | Técnico Superior en Higiene y Seguridad | Confirmar si incluye «en el Trabajo» |
| 7 | `GESTION DE ENERGIA RENOVABLES` | Gestión de Energías Renovables | `Tecnico superior en gestion de energia renovables` | Técnico Superior en Gestión de Energías Renovables | Concordancia corregida; confirmar |
| 8 | `GERONTOLOGIA` | Gerontología | `Tecnico Superios en Gerentologia` | Técnico Superior en Gerontología | Corregido |
| 9 | `DISEÑO DE INDUMENTARIA` | Diseño de Indumentaria | `TECNICO SUPERIOR EN DISEÑO DE INDUMENTARIA` | Técnico Superior en Diseño de Indumentaria | Correcto |
| 10 | `DESARROLO DE SOFTWARE` | Desarrollo de Software | `TECNICO SUPERIOR EN DESARROLLO DE SOFTWARE` | Técnico Superior en Desarrollo de Software | Corregido |
| 11 | `COCINA REGIONALES` | Cocina Regional | `COCINERO` | Cocinero | Confirmar nombre de la carrera |
| 12 | `AGENTE SANITARIO` | Agente Sanitario | `AGENTE SANITARIO` | Agente Sanitario | Confirmar título oficial |
| 13 | `ADMINISTRACION DE LA SALUD` | Administración de la Salud | `ADMINITRACION DE LA SALUD` | Administración de la Salud | Corregido; confirmar título oficial |

## Correcciones puntuales aplicadas

| Error | Corrección |
|---|---|
| `ADMINITRACION` | Administración |
| `DESARROLO` | Desarrollo |
| `Superios` | Superior |
| `Gerentologia` | Gerontología |
| `Hoteleria` | Hotelería |
| `ENFERMERIA` | Enfermería |
| `GESTION` / `ENERGIA` | Gestión / Energía |
| `COCINA REGIONALES` | Cocina Regional |
| `Energía Renovables` | Energías Renovables (concordancia) |

## Pendiente de confirmación institucional

No se modificaron denominaciones por criterio estético. Quedan para validar con la institución:

1. **Laboratorio** — el título figura solo como «Laboratorio». ¿La denominación oficial es «Técnico Superior en Laboratorio» u otra?
2. **Hotelería** — el título figura solo como «Hotelería». ¿Corresponde «Técnico Superior en Hotelería»?
3. **Higiene y Seguridad** — la descripción de la carrera menciona «Técnico Superior en Higiene y Seguridad en el Trabajo». Confirmar si el título oficial incluye «en el Trabajo».
4. **Gestión de Energías Renovables** — se corrigió la concordancia (energía → energías). Confirmar la denominación oficial.
5. **Cocina Regional** — confirmar que el nombre oficial es «Cocina Regional» (en la base figura «Cocina Regionales») y que el título otorgado es «Cocinero».
6. **Agente Sanitario** — confirmar si el título oficial es «Agente Sanitario» o una denominación más amplia.
7. **Administración de la Salud** — la descripción habla de «Técnico en Administración de Servicios de Salud». Confirmar el título oficial.
8. **Enfermería** — confirmar si el título oficial se expresa como «Enfermero/a» o de otra forma.

## Verificación

Prueba automática (33 casos y 33 pruebas de idempotencia):

```bash
node qa/pruebas-titulos.js
```

Resultado: `OK: 33 casos, 33 pruebas de idempotencia`.

Verificación en navegador (`oferta-academica.html`): 13 tarjetas, nombres y títulos con escritura uniforme, sin errores de consola. Filtros y búsqueda con y sin tildes funcionando.

## Regla en base de datos

Para que la escritura se mantenga igual sin importar cómo se tipee, ejecutar en Supabase → SQL Editor:

```sql
-- contenido de qa/sql/ofe-03-titulos.sql
```

Ese script crea la función `public.normalizar_denominacion`, el trigger de `carreras` y corrige los registros existentes. La corrección de concordancia «Energías Renovables» también está incluida.
