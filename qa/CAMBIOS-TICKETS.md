# Cambios implementados por ticket

Rama: `qa/auditoria-seguridad` · Base: `main` (`69bdcbd`) · Fecha: 15/11/2026.

## Resumen

| Ticket | Prioridad | Estado | Cambio principal |
|---|---|---|---|
| AUTO-01 | Baja | Resuelto | Se eliminaron los marcadores `[cite: 2]` del texto de Autoridades. |
| AUTO-02 | Baja | Resuelto | Se eliminaron los marcadores `[cite: 2]` de las descripciones del cuerpo directivo. |
| DASH-02 | Media | Implementado (requiere migración) | Ciclo de estados completo, responsable y registro de respuesta en el buzón. |
| EST-03 | Media | Implementado | Estados del calendario de exámenes calculados según fechas, sin valores fijos. |
| INI-01 | Baja | Resuelto | Se eliminó la superposición del hero con las tres tarjetas métricas. |
| INI-02 | Baja | Resuelto | Espaciado superior al navegar a «Identidad institucional». |
| INI-04 | Baja | Resuelto (parcial) | Redes sociales externas abren en pestaña nueva. Falta URL de YouTube. |
| INI-05 | Baja | Resuelto | Año del ciclo lectivo calculado dinámicamente. |
| INI-06 | Baja | Resuelto | Copyright con un solo año, calculado dinámicamente. |
| OFE-01 | Baja | Resuelto | Grilla de carreras centrada y con márgenes equilibrados. |
| OFE-04 | Media | Implementado (requiere datos) | «Modalidad» reemplazado por «Turno» en la oferta y en el panel. |

---

## Detalle

### AUTO-01 / AUTO-02 — Marcadores de cita expuestos

**Cambio:** se quitaron las tres apariciones de `[cite: 2]` en `autoridades.html` (subtítulo de la sección y descripciones de Rector y Vicerrectora).

**Verificación:** abrir `autoridades.html` y buscar `[cite`. No debe aparecer ningún resultado, ni en el texto ni en el HTML fuente.

**Origen:** eran marcas de una herramienta de generación de contenido que quedaron en el texto final. No hay más ocurrencias en el resto del sitio.

---

### DASH-02 — Ciclo de vida del buzón de consultas

**Cambio:**

- Nuevos estados: `Nuevo`, `Leído`, `Pendiente de respuesta`, `Respondido`, `Finalizado`.
- Nueva columna **Responsable** (email del administrador que atendió).
- Acciones por fila: leer, responder, finalizar y eliminar.
- Modal de detalle con selector de estado, responsable y campo para **registrar la respuesta**.
- Filtro por estado y contadores: total, nuevos, pendientes y finalizadas.
- El botón «Abrir en correo» mantiene el envío por el cliente de email (no se envía correo automático desde el sitio).
- El dashboard (`admin/index.html`) muestra el estado real de los últimos mensajes.

**Archivos:** `admin/contacto-management.html`, `admin/js/contacto-management.js`, `admin/js/index.js`, `qa/sql/migracion-tickets.sql`.

**Migración necesaria** (sin ella el buzón sigue funcionando en modo básico Nuevo/Leído y muestra un aviso):

```sql
-- Ejecutar en Supabase:
-- qa/sql/migracion-tickets.sql
```

**Pendiente de definición institucional:**

- Quiénes pueden responder/finalizar (hoy: cualquier usuario autenticado, porque no hay roles).
- Si el envío de la respuesta debe ser automático por SMTP/API y no por el cliente de correo.
- Plazo objetivo de atención para reportes.

**Prueba:**

1. Aplicar la migración.
2. Entrar al buzón con una consulta «Nuevo».
3. Abrirla: debe pasar a «Leído».
4. Escribir una respuesta y «Registrar respuesta»: debe quedar «Respondido», con responsable y fecha.
5. «Finalizar»: debe quedar «Finalizado».
6. Probar el filtro y los contadores.

---

### EST-03 — Estados del calendario de exámenes

**Cambio:** las filas ya no tienen estados fijos. `js/examenes.js` calcula el estado de cada turno según las fechas de inscripción y del período de exámenes:

- Antes de la inscripción → «Próximamente».
- Dentro del período de inscripción → «Inscripciones abiertas».
- Inscripción cerrada y exámenes por comenzar/en curso → «Inscripciones cerradas».
- Período terminado → «Concluido».

Con la fecha actual (15/11/2026), «Julio - Agosto» figura como concluido y «Noviembre - Diciembre» como inscripciones abiertas.

**Archivos:** `estudiante.html`, `js/examenes.js`, `css/styles.css`.

**Pendiente de definición institucional:**

- Confirmar el cronograma oficial y las fechas de cierre de inscripción.
- Las fechas están en `js/examenes.js` (constante `TURNOS`) y se pueden actualizar sin tocar el HTML. El año se toma automáticamente.

---

### INI-01 — Superposición del hero con las tarjetas

**Cambio:** `.metrics-overlap-section` ya no usa margen negativo (`-40px`); ahora tiene 40px de separación superior. Se mantiene el efecto de tarjetas destacadas sin invadir el hero.

**Archivo:** `css/styles.css`.

**Verificación:** en Inicio, a 1280px y 360px, las tres tarjetas deben quedar completamente debajo del hero, sin cruce.

---

### INI-02 — Espaciado al ir a «Identidad institucional»

**Cambio:** `.about-section` recibe `scroll-margin-top: clamp(110px, 12vh, 160px)`, que compensa el header fijo de 80px y deja aire proporcional al alto de pantalla.

**Archivo:** `css/styles.css`.

**Verificación:** clic en «Conocé el Instituto»; la sección debe quedar separada del header, sin quedar tapada.

---

### INI-04 — Redes sociales en pestaña nueva

**Cambio:** los enlaces externos de Facebook e Instagram del footer abren con `target="_blank"` y `rel="noopener noreferrer"` en todas las páginas (no solo Inicio, para mantener consistencia).

**Archivos:** `index.html`, `autoridades.html`, `oferta-academica.html`, `estudiante.html`, `agenda.html`, `novedades.html`, `contacto.html`.

**Pendiente:** YouTube y «Compartir» tienen `href="#"` (no hay URL institucional cargada). Cuando se informe la URL del canal, agregarla y aplicar el mismo `target="_blank"`. «Compartir» requiere además la lógica de Web Share API.

---

### INI-05 / INI-06 — Año dinámico

**Cambio:** se agregó `initAnioActual()` en `js/script.js`, que actualiza todos los elementos `[data-anio-actual]` con el año calendario actual.

- Hero: «Ciclo Lectivo 2026 • …».
- Footer: «© 2026 IES N° 11 Jujuy…».

**Archivos:** `js/script.js` y los siete HTML públicos.

**Verificación:** cambiar la fecha del sistema a 2027 y recargar; ambos textos deben mostrar 2027 sin editar código.

**Observación:** si la institución define que «ciclo lectivo» no coincide con el año calendario, habrá que separar ese dato del copyright. Hoy ambos usan el año actual, según lo pedido.

---

### OFE-01 — Márgenes de la oferta académica

**Cambio:** `.careers-grid` pasa de `grid` con `justify-content: start` a un contenedor `flex` con `flex-wrap` y `justify-content: center`. Así cada fila (incluida la última, que puede tener menos tarjetas) queda centrada y el conjunto deja de verse desplazado a la izquierda. Las tarjetas conservan su ancho máximo de 380px.

**Archivos:** `css/styles.css`, `oferta-academica.html` (se eliminaron reglas duplicadas en el `<style>` de la página).

**Verificación medida** (13 carreras, viewport 1000px): las 7 filas quedaron con 74px de margen izquierdo y 74px de derecho; la última fila, con una sola tarjeta, quedó a 278px de cada lado.

**Verificación pendiente:** repetir la medición en móvil (360px) y tablet (768px), donde las tarjetas se reducen por `flex-shrink`.

---

### OFE-04 — «Modalidad» → «Turno»

**Cambio:**

- La tarjeta pública muestra «Turno: …» en lugar de «Modalidad: Presencial».
- El panel de oferta agrega un selector de turno (Mañana, Tarde, Vespertino/Noche y combinaciones).
- La tabla de carreras del panel muestra el turno y «A confirmar» cuando está vacío.
- Hasta que se carguen los turnos oficiales, el sitio público muestra «A confirmar» (nunca un dato inventado).

**Archivos:** `oferta-academica.html`, `admin/oferta-management.html`, `admin/js/oferta-management.js`, `qa/sql/migracion-tickets.sql`.

**Migración necesaria:**

```sql
alter table public.carreras add column if not exists turno text;
-- incluido en qa/sql/migracion-tickets.sql
```

Si la migración no está aplicada, el panel sigue guardando el resto de la carrera y avisa que el turno no se almacenó.

**Pendiente de definición institucional:** turno oficial de cada carrera y si alguna se dicta en más de un turno.

**Prueba:**

1. Aplicar la migración.
2. En el panel, editar una carrera y asignar turno.
3. Verificar que la oferta pública muestra el turno.
4. Dejar una carrera sin turno: debe mostrar «A confirmar».

---

## Orden sugerido de despliegue

1. Backup de Supabase.
2. Ejecutar `qa/sql/migracion-tickets.sql`.
3. Desplegar los cambios de frontend.
4. Probar DASH-02 y OFE-04.
5. Revisar el calendario de exámenes con el cronograma oficial.

## Pruebas de regresión mínimas

- Inicio: hero, tarjetas, botón «Conocé el Instituto», footer.
- Autoridades: sin `[cite]`.
- Oferta: grilla centrada, turno visible.
- Estudiante: calendario con estados coherentes.
- Admin: login, buzón con estados, edición de carrera con turno.
- Revisar consola sin errores en todas las páginas.
