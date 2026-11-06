# HAS H5P Generator — despliegue seguro

## Migraciones Supabase

Aplicar en este orden, después de revisar cada SQL en el proyecto de destino:

1. `001_has_h5p_schema.sql`
2. `002_has_h5p_production_auth_schema.sql`
3. `003_harden_auth_rls_storage.sql`
4. `004_atomic_usage_quota.sql`
5. `005_versioned_private_packages.sql`

La migración 003 restringe tablas y convierte `has-h5p-store` en privado; la 004 reserva cuotas de manera atómica; la 005 agrega `storage_path` sin borrar ni modificar los paquetes existentes.
La tabla `storage.objects` es administrada por Supabase y ya tiene RLS habilitado; 003 no intenta cambiar su propiedad ni volver a ejecutar `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, que puede fallar con `42501` desde SQL Editor.

En una instalación existente, consulta el historial de migraciones y aplica solo las pendientes; no vuelvas a ejecutar migraciones ya aplicadas. La eliminación de perfiles de prueba en 002 afecta instalaciones limpias y no borra perfiles existentes. Si se ejecutó una versión anterior de `scripts/seed-users.js`, revisa y restablece/deshabilita las cuentas de prueba creadas antes de habilitar el servicio públicamente.

## Variables de entorno

Configurar en el entorno del servidor (por ejemplo, Vercel) según `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`: configuración pública de Supabase (publishable/anon).
- `SUPABASE_SERVICE_ROLE_KEY` (o `SUPABASE_SECRET_KEY`): solo servidor; habilita consultas administrativas y acceso al bucket privado. Nunca usar el prefijo `NEXT_PUBLIC_`.
- `PREVIEW_TOKEN_SECRET`: secreto aleatorio independiente recomendado, de al menos 32 caracteres; si se omite, el servidor usa la clave privada de Supabase para firmar la cookie temporal.
- `GROQ_API_KEY` y `GEMINI_API_KEY`: solo servidor para los endpoints de IA.
- `PH5P_TEMPLATE_PATH`: opcional; ruta local a `plantilla.h5p`. Si se omite, el backend descarga `templates/fiuao-6-215/plantilla.h5p` desde el bucket privado.

No colocar secretos en archivos rastreados ni en variables `NEXT_PUBLIC_*`.

## Plantilla H5P requerida

El compilador necesita el **paquete original de plantilla UAO** usado por los layouts (H5P Course Presentation 1.27), con `h5p.json` y `content/content.json` en la raíz del ZIP y las diapositivas/elementos de plantilla intactos. Los paquetes dentro de `public/preview-h5p/` son demos ya compiladas, no sustituyen esa plantilla base. Cárgala en `has-h5p-store/templates/fiuao-6-215/plantilla.h5p` o define `PH5P_TEMPLATE_PATH` en el servidor. Sin ese artefacto, la aplicación puede arrancar y mostrar demos, pero no compilar proyectos nuevos.

## Catálogo UAO del selector

El selector incluye 20 diseños agrupados en Facultad, Marca UAO y Composiciones. Los previews estáticos viven en `public/uao-templates/`; no contienen credenciales ni paquetes H5P.

Las cinco bases completas Facultad se guardan en el bucket **privado** `has-h5p-store` con estas rutas: `templates/uao/facultad/facultad-1.h5p` a `facultad-5.h5p`. Las cinco se probaron con el compilador y ofrecen 34 diapositivas base. El servidor elige la ruta mediante `baseTemplateId`, separado de la paleta `selectedTemplateId`; no se expone una URL pública.

En la aplicación, el Paso 1 selecciona una paleta sin cambiar la estructura. En el Paso 4 el profesor puede seleccionar una de las cinco bases H5P Facultad para el paquete completo y, de forma independiente, aplicar por diapositiva cualquiera de las diez composiciones extraídas del ZIP. Estas diez composiciones se incorporan como formas H5P reales sobre el layout pedagógico equivalente, preservando el texto y las interacciones; los paquetes de muestra de nueve diapositivas no se usan para compilar.

No se requiere una migración SQL adicional: `selectedTemplateId`, `baseTemplateId` y los `compositionId` de cada slide se conservan dentro de `project_spec`. Los proyectos previos que no tienen `baseTemplateId` siguen funcionando; el servidor conserva una base Facultad compatible. En otro entorno, vuelve a cargar las cinco bases desde el ZIP original con `CONFIRM_UPLOAD_UAO_TEMPLATES=1`, `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` configuradas en el entorno local seguro:

```bash
CONFIRM_UPLOAD_UAO_TEMPLATES=1 \
SUPABASE_URL="https://<project-ref>.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="<service-role-secret>" \
npm run upload:uao-template-bases -- /ruta/plantillas-uao-html-h5p.zip
```

El script comprueba que el bucket sea privado, verifica si los objetos ya coinciden y solo permite reemplazar un paquete distinto con `--overwrite` explícito.

La migración 002 no crea usuarios ni perfiles administrativos por defecto. Los usuarios se crean con Supabase Auth y reciben el rol estándar; cualquier promoción a administrador debe hacerse manualmente y por un operador autorizado.

## Paquetes previos a la privatización

La aplicación nueva escribe objetos versionados bajo `packages/<auth_user_id>/<project_id>/<version>.h5p`. Para instalaciones que conservaban paquetes antiguos en `packages/<project_id>.h5p`:

1. Aplicar 003 y 005.
2. Definir la URL pública del proyecto y la clave service-role en el entorno local seguro del operador.
3. Ejecutar `npm run migrate:packages` una vez. El script copia los paquetes a rutas privadas y actualiza `storage_path` únicamente para proyectos listos con propietario; conserva intactos los objetos originales.
4. Verificar previews y descargas con cuentas autenticadas antes de limpiar manualmente los objetos legacy.

La migración operativa no se ejecuta automáticamente y no borra archivos. Los proyectos sin `auth_user_id` coincidente o sin paquete legacy quedan intactos y se reportan como pendientes.
