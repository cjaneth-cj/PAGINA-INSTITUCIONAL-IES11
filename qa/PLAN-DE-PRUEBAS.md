# Plan de pruebas Q/A — Sitio institucional IES N° 11

## 1. Objetivo

Verificar que el sitio público y el panel de administración funcionen correctamente, sean accesibles, seguros y estables en los navegadores y dispositivos objetivo, y establecer una base repetible de regresión antes de cada despliegue.

## 2. Alcance

| Incluido | Excluido |
|---|---|
| Páginas públicas: `index`, `autoridades`, `oferta-academica`, `estudiante`, `novedades`, `agenda`, `contacto` | Infraestructura de hosting y DNS |
| Panel admin: login, dashboard, oferta, novedades, agenda, contacto, estudiantes | Backend interno de Supabase |
| Formularios públicos y chatbot | Correo electrónico institucional |
| Seguridad de aplicación (OWASP Top 10) | Pruebas de carga masiva / DDoS |
| Accesibilidad (WCAG 2.1 AA), performance y responsive | Apps móviles nativas (no existen) |

## 3. Entorno

| Elemento | Valor |
|---|---|
| URL local | `http://localhost:8080` |
| Servidor local | `python -m http.server 8080` |
| Navegadores | Chrome/Edge (últimas 2), Firefox, Safari (iOS/macOS) |
| Viewports | 360×640, 390×844, 768×1024, 1280×720, 1920×1080 |
| Datos | Cuentas y datos ficticios **solo en staging** |
| Herramientas | Lighthouse, axe DevTools/WAVE, OWASP ZAP, Playwright, k6 (opcional) |

> **Regla:** ninguna prueba de escritura, borrado o carga se ejecuta contra producción.

## 4. Criterios de entrada y salida

**Entrada:** rama desplegable, sitio accesible en staging, cuentas de prueba disponibles y datos semilla cargados.

**Salida:** 100 % de casos críticos/altos ejecutados, sin defectos abiertos de severidad crítica o alta, y regresión aprobada.

## 5. Casos de prueba funcionales

| ID | Módulo | Caso | Resultado esperado | Prioridad |
|---|---|---|---|---|
| FUN-001 | Navegación | Recorrer todos los enlaces del header y footer en desktop | Todas las rutas cargan, sin 404, sin enlaces rotos | Alta |
| FUN-002 | Navegación | Abrir menú hamburguesa en móvil, navegar y cerrar con Escape/overlay | El menú abre/cierra, bloquea scroll y devuelve el foco | Alta |
| FUN-003 | Home | Verificar carrusel/hero, accesos rápidos y secciones | Contenido correcto, sin solapamientos | Media |
| FUN-004 | Oferta | Listar carreras desde Supabase con datos | Se muestran todas las carreras activas | Alta |
| FUN-005 | Oferta | Abrir plan de estudio PDF y logo de cada carrera | Descarga/visualización correcta | Media |
| FUN-006 | Oferta | Simular error de red al cargar carreras | Mensaje de error amigable, sin pantalla rota | Media |
| FUN-007 | Novedades | Listar, filtrar y abrir una noticia | Contenido e imágenes correctos | Alta |
| FUN-008 | Agenda | Visualizar eventos y navegar el calendario | Fechas y eventos coinciden con la base | Alta |
| FUN-009 | Estudiante | Enviar consulta/trámite con datos válidos | Confirmación visible y registro creado | Alta |
| FUN-010 | Estudiante | Enviar con campos vacíos o email inválido | Validación impide el envío con mensaje claro | Alta |
| FUN-011 | Contacto | Enviar formulario completo | Mensaje de éxito y dato persistido | Alta |
| FUN-012 | Contacto | Enviar con adjuntos/emojis/caracteres especiales y acentos | Se guarda y muestra sin romper el layout | Media |
| FUN-013 | Contacto | Doble clic en "Enviar" | Un solo registro (botón deshabilitado durante el envío) | Media |
| FUN-014 | Chatbot | Abrir/cerrar, usar chips rápidos y enviar consulta | Responde y el input se reactiva siempre | Alta |
| FUN-015 | Chatbot | Provocar timeout o fallo de API | Respaldo local responde en ≤ 10 s | Alta |
| FUN-016 | Admin | Login con credenciales válidas / inválidas / vacías | Acceso correcto y mensajes claros | Crítica |
| FUN-017 | Admin | Acceder a `admin/index.html` sin sesión | Redirige a login y no expone datos | Crítica |
| FUN-018 | Admin | Cerrar sesión y volver atrás en el navegador | No se recupera la sesión | Alta |
| FUN-019 | Admin | CRUD de carrera (crear, editar, borrar) | Cambios reflejados en el sitio público | Crítica |
| FUN-020 | Admin | CRUD de noticia con subida de imagen | Imagen visible y reemplazo correcto | Alta |
| FUN-021 | Admin | CRUD de evento de agenda | Evento visible en el calendario público | Alta |
| FUN-022 | Admin | Leer, marcar leído y eliminar consulta | Estado y contadores se actualizan | Alta |
| FUN-023 | Admin | Gestionar solicitudes de estudiantes | Cambio de estado y borrado funcionan | Alta |
| FUN-024 | Admin | Subir archivo inválido o demasiado grande | Error controlado, sin subida parcial | Media |
| FUN-025 | Admin | Verificar que no haya errores en consola en ningún módulo | Consola limpia | Media |

> **FUN-023 está bloqueado** por la ausencia de las tablas `solicitudes_estudiantes` y `calendario_examenes` (ver FUN-01 del informe de seguridad). Coordinar con backend antes de ejecutarlo.

## 6. Casos de seguridad

Detalle y evidencia en [`INFORME-SEGURIDAD.md`](./INFORME-SEGURIDAD.md).

| ID | Caso | Herramienta | Prioridad |
|---|---|---|---|
| SEC-T01 | Confirmar RLS en todas las tablas (`SELECT/INSERT/UPDATE/DELETE` anónimo) | curl / PostgREST | Crítica |
| SEC-T02 | XSS almacenado vía formulario de contacto → panel admin | Manual + payloads | Crítica |
| SEC-T03 | XSS reflejado/DOM en chatbot y buscador | Manual | Alta |
| SEC-T04 | Bypass de `admin-auth.js` (JS deshabilitado, acceso directo) | Manual | Crítica |
| SEC-T05 | Escaneo pasivo con OWASP ZAP baseline | ZAP | Alta |
| SEC-T06 | Verificar CSP, HSTS, X-Frame-Options, nosniff | securityheaders.com / curl -I | Alta |
| SEC-T07 | Fuerza bruta y enumeración en login | Manual (staging) | Alta |
| SEC-T08 | Políticas del bucket `archivos` (subida anónima) | Supabase Dashboard | Alta |
| SEC-T09 | Exposición de claves/secretos en el bundle | grep / DevTools | Alta |
| SEC-T10 | CSRF en operaciones administrativas | Manual | Media |
| SEC-T11 | Clickjacking | Manual | Media |
| SEC-T12 | Dependencias CDN y SRI | Manual | Media |

### Payloads de referencia para XSS (solo en staging)

```text
<img src=x onerror=alert(1)>
"><svg/onload=alert(1)>
javascript:alert(document.domain)
<iframe srcdoc="<script>alert(1)</script>">
```

Nunca ejecutar estos payloads contra producción con usuarios reales conectados.

## 7. Accesibilidad (WCAG 2.1 AA)

| ID | Criterio | Verificación |
|---|---|---|
| A11Y-01 | Contraste de texto ≥ 4.5:1 | axe / WAVE |
| A11Y-02 | Navegación completa por teclado y foco visible | Manual |
| A11Y-03 | `alt` descriptivo en imágenes | Inspección (actualmente 18/18 con `alt`) |
| A11Y-04 | Jerarquía de encabezados correcta (un `h1` por página) | axe |
| A11Y-05 | Formularios con `label` asociado y errores anunciados | Manual + lector de pantalla |
| A11Y-06 | Chatbot operable por teclado y con `aria-live` en mensajes | Manual |
| A11Y-07 | Zoom 200 % sin pérdida de contenido | Manual |
| A11Y-08 | Respeto a `prefers-reduced-motion` | Manual |

## 8. Performance

| ID | Métrica | Objetivo |
|---|---|---|
| PERF-01 | Lighthouse Performance (móvil) | ≥ 80 |
| PERF-02 | LCP | < 2,5 s |
| PERF-03 | CLS | < 0,1 |
| PERF-04 | Peso total de la home | < 2 MB |
| PERF-05 | Imágenes con `loading="lazy"` y dimensiones explícitas | 100 % debajo del fold |

**Riesgo detectado:** `rectora.webp` (2,6 MB) y `vicerrectora.webp` (2,5 MB) sin `width/height` ni lazy loading en todos los casos. Convertir a AVIF/WebP comprimido y usar `srcset`.

## 9. Responsive y compatibilidad

| ID | Caso | Esperado |
|---|---|---|
| RWD-01 | 360 px: header, tablas admin y chatbot | Sin scroll horizontal |
| RWD-02 | 768 px: grillas de carreras y noticias | Columnas correctas |
| RWD-03 | 1920 px: legibilidad y ancho máximo | Contenido centrado |
| RWD-04 | Orientación landscape en móvil | Sin solapamientos |
| RWD-05 | Safari iOS: formularios, fechas y PDF | Sin diferencias funcionales |

## 10. Regresión antes de cada despliegue

1. Smoke test de las 7 páginas públicas + login.
2. Enviar un formulario de contacto y verificar el registro en admin.
3. Login admin, crear y borrar un registro de prueba.
4. Ejecutar `qa/sql/hardening-rls.sql` en staging y repetir los casos SEC-T01 y SEC-T02.
5. Lighthouse móvil y axe sin errores críticos nuevos.

## 11. Automatización recomendada

- **Playwright**: smoke test de navegación, formularios y login; screenshots por viewport.
- **GitHub Actions**: ejecutar Playwright + `axe-core` en cada PR.
- **OWASP ZAP baseline**: job programado contra staging.
- **npm audit / Dependabot**: aunque hoy no hay dependencias locales, sirve si se migra a un bundler.
