# Q/A y Seguridad — PAGINA-INSTITUCIONAL-IES11

Carpeta de trabajo para las pruebas de calidad y seguridad del sitio institucional del IES N° 11.

## Estado

| Dato | Valor |
|---|---|
| Repositorio | `cjaneth-cj/PAGINA-INSTITUCIONAL-IES11` |
| Rama de pruebas | `qa/auditoria-seguridad` |
| Commit base auditado | `69bdcbd` (`main`) |
| Fecha de auditoría | 2026-11-14 |
| Tipo de proyecto | Sitio estático (HTML/CSS/JS) + Supabase + CDN |
| Backend | Supabase (`smoizmmrkhdgrirfcynu.supabase.co`) |
| Build / dependencias | No hay `package.json`; Supabase JS se carga por CDN |

## Documentos

- [`INFORME-SEGURIDAD.md`](./INFORME-SEGURIDAD.md): hallazgos de seguridad con evidencia, impacto y remediación.
- [`PLAN-DE-PRUEBAS.md`](./PLAN-DE-PRUEBAS.md): alcance, casos de prueba funcionales, accesibilidad, performance y regresión.
- [`sql/hardening-rls.sql`](./sql/hardening-rls.sql): script de endurecimiento de Supabase (**no aplicar sin probar en staging**).

## Cómo levantar el sitio en local

El proyecto no necesita compilación. Basta con servirlo por HTTP (no abrir con `file://`, porque rompe las rutas y los módulos):

```powershell
python -m http.server 8080
# Sitio público:  http://localhost:8080/
# Panel admin:    http://localhost:8080/admin/login.html
```

Alternativas: `npx serve .` o la extensión Live Server de VS Code.

> El panel admin y los formularios dependen de Supabase, por lo que requieren conexión a internet. Las credenciales de prueba **no** se guardan en el repositorio.

## Convención de severidad

| Nivel | Criterio |
|---|---|
| Crítico | Compromiso total, fuga masiva de datos personales o pérdida de integridad del contenido sin credenciales. |
| Alto | XSS explotable, exposición de secretos, ausencia de controles clave. |
| Medio | Debilita defensas en profundidad o requiere condiciones adicionales. |
| Bajo | Buenas prácticas, información de bajo impacto. |

## Reglas de la auditoría

- Las pruebas dinámicas fueron **de solo lectura** o con filtros que no pueden coincidir con filas reales. No se modificó ni eliminó información de producción.
- No se publicaron ni compartieron datos personales extraídos de la base.
- Cualquier prueba de escritura (`INSERT`/`UPDATE`/`DELETE`) debe hacerse en un entorno de staging con datos ficticios.
