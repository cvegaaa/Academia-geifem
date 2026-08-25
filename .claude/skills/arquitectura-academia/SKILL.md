---
name: arquitectura-academia
description: Decisiones vivas de estructura y construcción de Academia, la plataforma de cursos de Vegora (stack, módulos, modelo de datos, roles). Consultar antes de tocar código en este proyecto; actualizar cada vez que se tome una decisión arquitectónica nueva o se cierre una fase de construcción.
---

# Arquitectura y decisiones de construcción — Academia

Esta skill es el registro vivo de las decisiones tomadas para construir Academia, la plataforma
de cursos online de Vegora (responsabilidad social de GEIFEM Consultoría). Se actualiza a medida
que avanza el proyecto — no es un documento congelado. Origen del proyecto:
`Plan_Construccion_Plataforma_Cursos_Vegora_GEIFEM.docx`. Carpeta del proyecto: `Apps/academia`.

## Alcance decidido

Plataforma propia en código (no marketplace tipo Hotmart, no WordPress) — equivalente a la
"Opción B" del plan, construida directamente en vez de empezar solo con landing de preventa.
MVP completo: catálogo → pago → entrega automática de contenido → evaluaciones → certificado
automático → panel admin.

## Stack técnico

Igual al usado en `geifem-agentes` (mismo repo `Apps/`), para no introducir tooling nuevo:

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui sobre Radix
- PostgreSQL 18 + Drizzle ORM
- better-auth — autenticación por **email + contraseña**
- Resend — correo transaccional
- Docker Compose autoalojado
- pnpm, Biome (lint/formato), Vitest (unit/integración), Playwright (E2E)

## Roles

- **Admin** (Vegora/GEIFEM): acceso total — contenido, pagos, configuración, becas, reportes.
- **Instructor/Editor de contenido**: crea y edita cursos, unidades, materiales y evaluaciones.
  Sin acceso a pagos, configuración ni becas.
- **Estudiante**: compra, estudia, presenta evaluaciones, descarga certificado.

## Estructura de contenido (editable, sin cantidades fijas en código)

```
Curso
 └─ Unidad (4 por defecto, cantidad editable por el admin/instructor)
     ├─ 1 material escrito
     ├─ 1 video de refuerzo (YouTube no listado)
     ├─ 1 video de ejercicio (YouTube no listado)
     └─ 1 evaluación de preguntas
```

Todo (cursos, unidades, materiales, videos, evaluaciones) debe poder crearse, editarse y
eliminarse desde el panel admin. Ninguna cantidad de unidades ni de elementos por unidad va
quemada en el código — son registros en base de datos.

**Evaluaciones**: soportan tres tipos de pregunta — selección única, selección múltiple y
verdadero/falso.

**Navegación del contenido en el área del estudiante**: el contenido de una unidad **no** se
muestra todo junto en una sola pantalla. Al seleccionar una unidad se despliega un árbol con sus
4 ítems (material, video de refuerzo, video de ejercicio, evaluación); el estudiante revisa un
ítem a la vez en el panel principal, y "Marcar como leído/visto" o "Enviar evaluación" avanza
automáticamente al siguiente ítem del árbol. El árbol también permite saltar directo a cualquier
ítem, completado o no. Implementado en `src/components/student-course-view.tsx`.

## Video

YouTube no listado (sin costo), embebido tras verificar la compra/matrícula. Decisión explícita
de no usar Cloudflare Stream en el MVP por costo; reevaluar en Fase 2 si se necesita control de
acceso más estricto (URLs firmadas). Comparativa completa quedó discutida en la conversación de
planificación — no repetida aquí para no duplicar razonamiento, ver commit/histórico del proyecto
si hace falta el detalle.

## Pagos

**ePayco** (checkout + webhook de confirmación) — no Wompi. Decisión cambiada tras verificar que
Wompi, en su modelo de checkout estándar (agregador), **solo desembolsa a cuentas Bancolombia o
Nequi** — la cuenta de liquidación de Vegora/GEIFEM es de **Davivienda**, que Wompi no soporta.
ePayco en cambio es propiedad de Davivienda (lo adquirió al 100%) y da tarifas preferenciales y
retiros gratuitos a cuentas Davivienda — encaja directo con la cuenta real del negocio. Debe
habilitar PSE desde el día uno, no solo tarjeta — es el medio de pago más probable para el
público objetivo (jóvenes sin tarjeta de crédito).

## Facturación electrónica

**Automática desde el MVP** (no manual): cada venta confirmada por el webhook de ePayco debe
generar factura electrónica automáticamente, usando la infraestructura de facturación que ya
tiene GEIFEM — **Alegra**. Es el mismo proveedor contable que integra `geifem-agentes`
(ver `src/lib/connectors/providers/alegra/tools.ts` en ese proyecto como referencia de patrón de
integración — arquitectura del conector, no las credenciales).

**Corrección importante (antes decía algo distinto y era falso):** la conexión Alegra vía MCP
disponible en las sesiones de Claude Code en esta máquina **NO es la cuenta de GEIFEM** — es la
cuenta de **Qualitad**, un cliente de GEIFEM conectado a través del SaaS multi-tenant
`geifem-agentes` (que existe justamente para que los clientes de GEIFEM conecten su propio
Alegra). Cualquier hallazgo obtenido por esa vía (resoluciones, ítems, facturas) pertenece a
Qualitad, no a GEIFEM/Academia — **nunca usar esa conexión para nada de Academia**. Para
facturación real de Academia hace falta pedirle al usuario las credenciales de la cuenta Alegra
de GEIFEM específicamente (correo + Token de API, desde Configuración → API en Alegra) — no
asumir que existe acceso ya autorizado a ella.

**Credencial real de GEIFEM ya cargada y verificada** (2026-08-24): `ALEGRA_API_TOKEN` en `.env`
es un JWT tipo "integration" (no el token corto clásico de Basic Auth) — se autentica como
`Authorization: Bearer <token>` contra `https://api.alegra.com/api/v1/` (no la API de e-provider).
Verificado con una petición real (`GET /contacts`, devolvió el contacto real de Carlos Vega).
Cliente implementado en `src/server/alegra.ts` (`findOrCreateContact`, `createInvoice`).

**Estado real de la cuenta de GEIFEM en Alegra (confirmado por API, no supuesto):**
- Resolución DIAN electrónica activa de verdad: `numberTemplate.id = "15"`, prefijo `FV`,
  próximo número 203, hasta 500, `isElectronic: true`, vigente hasta 2028-08-21. Esta es la que
  hay que usar (`numberTemplateId: "15"` en `createInvoice`) — no la resolución `id: "1"`
  ("Principal", `isElectronic: false`, esa no sirve para factura electrónica DIAN).
- Impuestos disponibles: IVA Exento (`id 1`, 0%), IVA Excluido (`id 2`, 0%), IVA 5% (`id 3`), IVA
  19% (`id 4`).
- Ítems existentes: `id "2"` "Asesoria tecnica" (con IVA 19%) e `id "1"` "Venta simple" (sin
  impuesto, precio $0) — **ninguno es específico para cursos todavía**.

**Decisiones de negocio aún pendientes de responder por el usuario** (no adivinar, es dinero y
cumplimiento tributario real):
1. ¿Los cursos de Academia llevan IVA? Si sí, ¿19% o 5%? Si no, ¿exento o excluido? (confirmar
   con el contador de GEIFEM, como ya señalaba el plan original en su sección 6).
2. ¿Se crea un ítem nuevo específico ("Curso Academia") con el impuesto que corresponda, o se
   reutiliza "Venta simple" ajustando el precio en cada factura? Recomendado: ítem nuevo
   dedicado, para que los reportes de Alegra separen ingresos de Academia del resto de GEIFEM.
3. El checkout de Academia hoy solo pide nombre y correo — la factura electrónica exige
   identificación del comprador (`findOrCreateContact` ya la pide como parámetro). Falta agregar
   ese campo al flujo de compra (`/carrito` o un paso previo) antes de poder disparar
   `createInvoice` automáticamente desde el webhook de ePayco.

Hasta que se respondan 1 y 2, y se agregue el campo de identificación (3), `createInvoice` **no**
está conectado todavía al webhook de confirmación de pago — el cliente de Alegra existe y está
probado, pero no se llama automáticamente todavía.

## Legal

Términos de uso, política de privacidad y flujo de consentimiento de acudiente para menores
(sección 6 del plan) se **adaptan de los ya existentes en www.geifem.com** — no se redactan desde
cero. Falta por hacer: localizar los textos actuales en ese sitio y ajustarlos al contexto de
Academia (venta de cursos, no consultoría) antes de publicarlos.

## Dominio y hosting

Subdominio de GEIFEM: **`academia.geifem.com`** (no se compra dominio nuevo). Servidor/VPS de
despliegue del Docker Compose aún por definir — no bloquea el desarrollo en local, pero hay que
resolverlo antes de salir a producción.

## Marca visible al usuario

Vegora es quien construye la plataforma, **no** la marca de cara al estudiante. "Vegora" no debe
aparecer en el frontend salvo en una línea de atribución tipo "Desarrollado por" (pie del
catálogo, pie del certificado). En todo lo demás (header, título de la pestaña, panel del
estudiante, panel admin) el nombre visible es solo **Academia**. GEIFEM sí puede nombrarse más
ampliamente (responsabilidad social, becas) porque es parte de la propuesta de valor, no solo del
crédito de construcción.

## Identidad visual

Sin marca definida todavía para Academia. Se propone una identidad visual básica (paleta,
tipografía) coherente y fácil de reemplazar después, no una marca definitiva.

## Certificados

PDF generado automáticamente al completar el 100% de las unidades de un curso (todas las
evaluaciones aprobadas). Incluye **código de verificación pública**: página tipo
`/verificar/[codigo]` donde cualquiera (ej. un empleador) puede confirmar la autenticidad del
certificado.

## Becas GEIFEM

Asignación **manual**: el admin decide y asigna el cupo becado a un estudiante o colegio. El
sistema debe mostrar un contador de matrículas pagas / cupos potenciales según el % definido
(sección 7 del plan: 5% de ingresos netos en Fase 0-1, escalando a 10% en Fase 2), pero no
automatiza la asignación del beneficiario.

## Catálogo público, carrito y sesión

- Cada curso tiene su propia página (`/cursos/[slug]`) con información completa y dos acciones:
  **Comprar ahora** (agrega al carrito y va directo a `/carrito`) y **Agregar al carrito** (suma
  sin salir de la página).
- **Carrito** (`/carrito`): varios cursos antes de pagar, cantidades no aplican (una matrícula por
  curso), quitar ítems, total, botón de pago.
- **Login** (`/login`, mock — sin backend real todavía): un único punto de entrada para dos casos:
  (a) quien ya compró entra a ver su panel; (b) quien **no** ha comprado puede entrar primero y
  comprar desde adentro. No hay checkout como usuario anónimo — al intentar pagar sin sesión, se
  redirige a `/login?next=/carrito` y, tras "iniciar sesión", vuelve automáticamente al carrito a
  completar la compra.
- **Mi cuenta** (`/cuenta`): si no hay sesión, invita a iniciar sesión. Si hay sesión, muestra
  "Mis cursos" (comprados, con acceso directo a `/estudiante/[slug]`) y debajo el resto del
  catálogo para seguir comprando sin salir de la cuenta.
- Estado de carrito/sesión implementado con contexto de React + `localStorage`
  (`src/lib/store.tsx`, `AppStoreProvider` envuelve la app en `src/app/layout.tsx`) — es
  deliberadamente de mentira, se reemplaza por sesión real (better-auth) y carrito ligado al
  backend cuando se conecte esa fase.

## Módulos del sistema

1. **Contenido/Cursos** — cursos, unidades, materiales, videos, evaluaciones
2. **Pagos** — checkout ePayco, transacciones, estado de pago, facturación electrónica automática
   vía Alegra
3. **Usuarios/Estudiantes** — perfil, datos personales, login
4. **Configuración** — nombre del sitio, moneda, textos legales, datos de facturación
5. **Matrícula/Acceso** — qué estudiante tiene acceso a qué curso, historial de compras
6. **Progreso y Evaluaciones** — avance por unidad, resultados, intentos
7. **Certificados** — generación, plantilla, verificación pública
8. **Becas GEIFEM** — criterio, cupos, asignación manual, contador público
9. **Notificaciones** — bienvenida, confirmación de pago, certificado listo (Resend)
10. **Reportes/KPIs (admin)** — matrículas/mes, tasa de finalización, becas otorgadas, CAC
    (métricas de la sección 10 del plan)
11. **Roles y permisos** — Admin / Instructor / Estudiante
12. **Catálogo público** — landing, ficha de curso, checkout

## Acceso al panel admin

`/admin` estaba **sin protección** hasta esta ronda — cualquiera podía entrar y editar cursos. Ya
tiene guardia real: `src/app/admin/page.tsx` valida la sesión con `auth.api.getSession` y exige
`role === "admin"`, redirigiendo a `/admin/login` si no hay sesión válida. Login real con
better-auth (`src/app/admin/login/page.tsx` vía `authClient.signIn.email`), no el store de
mentira (`src/lib/store.tsx`) que usa el login de estudiantes en `/login`.

**Cuenta de superadmin creada:** `Cvegaa@geifem.com` — contraseña definida por el usuario en el
chat de esta sesión (`Cv171290*`). **Cambiarla tras el primer login real en producción**, ya que
quedó en texto plano en esta conversación. Creada con `scripts/create-admin.ts <email> <password>
[nombre]` — usa `auth.api.signUpEmail` de better-auth (nunca insertar directo en `account.password`
a mano, el hash tiene que salir de better-auth) y luego marca `role="admin"` en la tabla `user`.
Reusar ese script para futuros administradores o instructores (ajustando el role a mano en DB para
`instructor`, no hay UI de gestión de roles todavía).

**Puerto de desarrollo fijado en 3010** (`package.json` → `"dev": "next dev -p 3010"`,
`.claude/launch.json` → `"port": 3010, "autoPort": false`, `.env` → `BETTER_AUTH_URL=http://localhost:3010`).
Antes el puerto cambiaba en cada reinicio del preview (autoPort, porque 3000 ya lo ocupa otro
proceso en esta máquina) y eso rompía la validación de origen de better-auth (403 en
`/api/auth/sign-in/email`) — si `BETTER_AUTH_URL` alguna vez deja de coincidir con el puerto real,
el login falla con ese mismo síntoma.

## Contenido real vs. datos de semilla

`src/lib/mock-data.ts` **ya no lo lee la app** — solo lo usa `scripts/seed.ts` como catálogo de
referencia para poblar datos de prueba en desarrollo. La fuente real de contenido es la base de
datos, cargada desde el panel admin (`src/server/courses.ts`: `listCoursesForAdmin`,
`getPublishedCourses`, `getCourseBySlug`, `createDraftCourse`, `saveCourse`, `deleteCourse`,
llamadas desde Server Actions en `src/server/actions/courses.ts`). La base de datos de desarrollo
se dejó **en blanco a propósito** (se truncó el catálogo de prueba) — el contenido real se carga
desde `/admin`, no desde el seed. `pnpm run db:seed` sigue disponible si hace falta volver a
poblarla con datos de prueba.

Guardar un curso desde el admin lo publica automáticamente (`estado: "publicado"`) — no hay
todavía un flujo de borrador/publicación separado; si se agrega más adelante, ajustar
`saveCourse` en `src/server/courses.ts`.

## Material escrito con archivo adjunto

El material escrito de cada unidad admite, además del texto, un **archivo adjunto opcional**
(PDF, Word, ODT o TXT, máx. 15MB) — lo que faltaba definir en la ronda anterior. Se sube desde el
admin (`src/components/admin-material-upload.tsx`) a `POST /api/uploads`
(`src/app/api/uploads/route.ts`), que lo guarda en disco local bajo
`public/uploads/materiales/<uuid>.<ext>` y devuelve la URL pública. Columnas `material_archivo_url`
/ `material_archivo_nombre` en `units`. El estudiante ve un botón de descarga en el material si hay
archivo adjunto (`src/components/student-course-view.tsx`).

Decisión: almacenamiento en disco local, no un bucket — suficiente para el despliegue autoalojado
de un solo contenedor (`academia.geifem.com`). Si en el futuro se escala a múltiples instancias,
migrar a S3/Cloudflare R2 — no antes (YAGNI).

## Modelo de datos (implementado en `src/lib/db/schema.ts`)

- `user`, `session`, `account`, `verification` (better-auth) — `user.role`: admin | instructor |
  estudiante
- `courses` (slug, título, bloque A/B, resumen, descripción, `precio_cents`, duración, estado)
- `units` (course_id, título, orden, **más las columnas de material/video de cada unidad
  directamente** — no hay tabla `materials` separada: cada unidad tiene por estructura exactamente
  1 material + 1 video de refuerzo + 1 video de ejercicio, no listas)
- `assessments` (unit_id único, título)
- `assessment_questions` (assessment_id, orden, tipo: unica/multiple/vf, enunciado, opciones
  jsonb, correctas jsonb)
- `enrollments` (user_id, course_id, estado_pago, % completado, fecha)
- `payments` (enrollment_id, referencia_epayco, monto, estado, factura_alegra_id)
- `progress` (enrollment_id, unit_id, material_visto, video_refuerzo_visto, video_ejercicio_visto,
  evaluación_aprobada, puntaje)
- `certificates` (enrollment_id, codigo_verificacion, fecha_emision, url_pdf)
- `scholarships` (criterio, cupos_disponibles, beneficiario_user_id, curso_id, fecha_asignacion)

## Orden de construcción: UI primero, backend después

Preferencia explícita del usuario (ver `vegora-app-building` para el principio general): quiere
ver pantallas reales pronto y validarlas antes de que se conecte backend, para evitar doble
trabajo por construir en la dirección equivocada. Para Academia, el orden es:

1. Pantallas clave con datos de mentira (catálogo público, ficha de curso, checkout, área del
   estudiante con una unidad de ejemplo, panel admin) — código real de Next.js, sin DB/auth/pagos
   conectados todavía.
2. Validación del usuario sobre esas pantallas.
3. Recién ahí: esquema Drizzle, better-auth, ePayco, Alegra, generación real de certificados.

## Estado del proyecto

- [x] Plan de negocio revisado (documento GEIFEM)
- [x] Alcance, stack, módulos y modelo de datos de alto nivel definidos
- [x] Facturación (Alegra), legal (adaptar de geifem.com), dominio (academia.geifem.com) e
      identidad visual (básica, a proponer) definidos
- [x] Scaffold del proyecto (Next.js 16 + Tailwind v4, sin backend todavía — identidad visual
      básica propia definida en `src/app/globals.css`, sin shadcn instalado aún, componentes
      propios simples en `src/components/ui.tsx`)
- [x] Pantallas clave con datos de mentira construidas: catálogo público (`/`), ficha de curso
      (`/cursos/[slug]`), área del estudiante interactiva (`/estudiante/[slug]`), certificado
      (`/estudiante/[slug]/certificado`), verificación pública (`/verificar/[codigo]`), panel
      admin (`/admin`, tabs Cursos y Becas funcionales, el resto placeholder). Datos de mentira en
      `src/lib/mock-data.ts` y `src/lib/certificate.ts`.
- [x] Edición de contenido en el admin: crear/editar/eliminar curso, y dentro de cada curso
      crear/editar/eliminar unidades y su material, videos y preguntas de evaluación (tipo,
      enunciado, opciones, respuesta(s) correcta(s)) — todo en memoria (sin persistencia real
      todavía). Implementado en `src/components/admin-course-editor.tsx`, conectado desde
      `src/components/admin-shell.tsx`. La respuesta correcta se marca con un botón "Correcta"
      explícito junto a cada opción, no un radio/checkbox desnudo — feedback de usuario: la
      versión inicial con input nativo sin etiqueta visible no era descubrible.
- [ ] Validación del usuario sobre esas pantallas (pendiente — mostrar y recoger feedback)
- [x] Backend base conectado: Postgres 18 vía Docker Compose (`docker-compose.yml`, servicio
      `db` únicamente por ahora — corre dentro de WSL/Ubuntu en esta máquina, no Docker Desktop
      para Windows), esquema Drizzle completo (`src/lib/db/schema.ts`, 13 tablas: identidad de
      better-auth + contenido + matrícula/pagos/progreso + certificados/becas), better-auth
      (`src/lib/auth.ts`) con email+contraseña y campo `role`, migración inicial aplicada, y
      `scripts/seed.ts` que carga el catálogo de `mock-data.ts` a la DB real (verificado: 6
      cursos, 24 unidades, 72 preguntas). Dinero en centavos (`precioCents`, `montoCents`), nunca
      float. Ver `CLAUDE.md` del proyecto para comandos.
- [x] Páginas reconectadas a la DB real: catálogo (`/`), ficha de curso (`/cursos/[slug]`), área
      del estudiante (`/estudiante/[slug]` y su certificado), `/cuenta` y panel admin (`/admin`)
      leen/escriben contenido vía `src/server/courses.ts` y las Server Actions de
      `src/server/actions/courses.ts` — ya no leen `mock-data.ts`. Base de datos de desarrollo
      dejada en blanco a propósito (truncada tras verificar). Verificado end-to-end en el
      navegador: crear curso en `/admin` → guardar → aparece en `/` → eliminar → desaparece.
      Subida de archivo de material verificada contra `POST /api/uploads` (guarda en disco, sirve
      público, se borra al limpiar la prueba).
- [x] Sesión de estudiante real (better-auth) — `/login` ya no es mock: usa
      `authClient.signIn.email` / `signUp.email` de verdad. `src/lib/store.tsx` quedó reducido a
      solo el carrito (localStorage, correcto que siga así — es normal tener el carrito
      pre-checkout en el cliente incluso con backend real); `useAuth()` ahí mismo es ahora un
      wrapper delgado sobre `authClient.useSession()`. `/cuenta` es Server Component: lee la
      sesión con `auth.api.getSession` y trae "Mis cursos" con `getMyCourses(userId)`
      (`src/server/courses.ts`, basado en `enrollments.estadoPago = 'pagado'`) — ya no de
      `localStorage`.
- [x] Checkout ePayco: credenciales reales cargadas (`EPAYCO_PUBLIC_KEY`, `EPAYCO_PRIVATE_KEY`,
      `EPAYCO_P_CUST_ID_CLIENTE`, `EPAYCO_P_KEY`, `EPAYCO_TEST_MODE=true` — cuenta de Carlos Vega,
      modo sandbox). Flujo completo escrito: `startCheckoutAction`
      (`src/server/actions/checkout.ts`) crea `enrollment`+`payment` en estado "pendiente"
      (`src/server/checkout.ts::createPendingCheckout`, todas las filas de un mismo carrito
      comparten un `invoice` uuid) y abre una sesión real de ePayco
      (`src/server/epayco.ts::createCheckoutSession`, vía Apify). El widget se abre en
      `/carrito` con `src/components/epayco-checkout.tsx` (carga `checkout-v2.js` y
      `ePayco.checkout.configure({sessionId, test}).open()`). El webhook
      (`POST /api/webhooks/epayco`) valida `x_signature` (sha256 de
      `P_CUST_ID_CLIENTE^P_KEY^x_ref_payco^x_transaction_id^x_amount^x_currency_code`, ver
      `verifyWebhookSignature`) antes de marcar nada, y `confirmCheckout` es idempotente (ePayco
      reintenta el webhook).
      **Verificado con la API real de ePayco** (login + `session/create` con `curl`/Node directo,
      fuera del navegador): las credenciales son válidas y la creación de sesión funciona.
      **Bloqueador real para probar el flujo completo en el navegador local:** ePayco **rechaza
      `response`/`confirmation` con URL `localhost`** ("property Response/Confirmation is not a
      valid URL") — solo acepta URLs públicas. No se puede completar un pago de prueba end-to-end
      hasta desplegar a un dominio público (`academia.geifem.com`) o usar un túnel HTTPS temporal
      (ngrok/Cloudflare Tunnel) apuntando a `localhost:3010`. El código en sí ya quedó probado
      contra la API real de ePayco, solo falta la URL pública para el último tramo.
- [x] Acceso al área del estudiante protegido — `/estudiante/[slug]` **no tenía ninguna
      verificación de compra** (cualquiera con la URL veía el contenido completo del curso sin
      pagar). Corregido: exige sesión real y matrícula con `estado_pago = 'pagado'`
      (`getEnrollmentForUser`, `src/server/progress.ts`); si no hay match, `notFound()` — nunca se
      revela si el problema es "no compraste" o "el curso no existe".
- [x] Progreso persistido en DB — `progress` ya no vive solo en estado de React:
      `markStepAction` (`src/server/actions/progress.ts`) escribe cada paso vía `markStep`
      (`src/server/progress.ts`); el material/videos se marcan optimista + en segundo plano, la
      evaluación **espera la respuesta del servidor** antes de decidir si avanza.
- [x] **Evaluación con umbral de aprobación (60%)** — decisión del usuario: si no aprueba, no
      avanza de unidad. La calificación se calcula server-side comparando `answers` contra
      `pregunta.correctas` (nunca confiar en el cliente para esto); si `puntaje < 60`, se guarda
      el intento pero `evaluacionAprobada` queda en `false` y la UI muestra el error y deja
      reintentar en la misma unidad. Probado en el navegador: respuesta incorrecta → bloqueado
      con "No aprobaste (0%)"; respuesta correcta → "✓ Aprobaste con 100%" y avanza.
- [x] Certificados reales — al completar todas las unidades de un curso (`markStep` detecta
      `courseComplete`), se emite automáticamente un certificado en `certificates` con código
      `ACAD-XXXXXXXX` (`issueCertificateIfMissing`). `/estudiante/[slug]/certificado` y
      `/verificar/[codigo]` ya leen de la DB real (`getCertificateForEnrollment`,
      `getCertificateByCode`, `src/server/progress.ts`) — `src/lib/certificate.ts` (mock) se
      eliminó, ya no lo usa nada. "Descargar PDF" usa `window.print()` con CSS `print:` en el
      certificado (sin librería de PDF en servidor — YAGNI para el MVP; si hace falta un PDF
      generado server-side más adelante, ese es el punto a revisar).
      Probado de punta a punta en el navegador con un curso de 1 unidad: falló evaluación → no
      avanzó; aprobó → certificado emitido, visible en `/estudiante/.../certificado` y válido en
      `/verificar/ACAD-...`.
- [x] Panel admin: Matrículas, Pagos y Reportes conectados a datos reales
      (`src/server/admin.ts`: `listEnrollmentsForAdmin`, `listPaymentsForAdmin`, `getReportStats`
      — joins directos con Drizzle, no pasan por `courses.ts`). Reportes: matrículas pagadas,
      ingresos totales, top 5 cursos más vendidos. Probado con datos reales en el navegador.
      **Configuración se dejó explícitamente como placeholder** — no hay todavía nada real que
      configurar (nombre del sitio, textos legales, etc. siguen hardcodeados en el código); la
      pantalla lo explica en vez de mostrar un formulario vacío. Construirla cuando haya un primer
      dato real que mover ahí — no antes (evitar la pantalla de ajustes vacía "por si acaso").
- [x] Categorías de curso — etiquetas de texto libre (`courses.categorias`, jsonb string[], no una
      tabla de categorías separada — YAGNI, catálogo chico). Editables como chips en el admin con
      autocompletado de las ya usadas (`src/components/admin-category-tags.tsx`,
      `getAllCategories()` en `src/server/courses.ts`). Se muestran en la tabla de cursos del
      admin y como badges en las tarjetas del catálogo público.
- [x] Buscador y filtro de categorías en el catálogo público — `src/components/catalog-browser.tsx`
      (client, filtra en memoria la lista ya cargada — el catálogo es chico, no hace falta ir al
      servidor por cada tecla). Buscador por título/resumen + chips de categoría multi-selección
      (AND, no OR — un curso debe tener todas las categorías activas para aparecer). Probado en el
      navegador: filtrar por categoría oculta el curso que no la tiene; buscar por texto también.
- [x] Landing enriquecida — **decisión del usuario: no separar rutas** (se consideró `/` landing +
      `/cursos` catálogo, pero se prefirió enriquecer la misma página). `/` ahora tiene, en orden:
      hero (con `HeroVisual`, composición abstracta de íconos — deliberadamente no fotos de stock
      de "estudiantes" que no existen) → propuesta de valor (4 bullets, contenido real del plan
      original, no inventado) → **estadísticas del contenido** → "Cómo funciona" (4 pasos, ancla
      `#como-funciona`) → bundle → catálogo (ancla `#catalogo`) → **testimonios** → **FAQ** →
      becas → footer. Los botones del hero navegan por ancla a esas secciones.
- [x] **Estadísticas del contenido (no de graduados)** — decisión explícita del usuario: mostrar
      cifras reales del catálogo (total de cursos, horas, unidades, categorías), nunca cifras de
      egresados/graduados inventadas o infladas. `getContentStats()` (`src/server/courses.ts`)
      calcula todo desde `courses`/`units` filtrando `estado = 'publicado'`. La sección
      (`section.bg-ink` en `src/app/page.tsx`) solo se renderiza si `stats.totalCursos > 0` — igual
      que testimonios, nunca hay "0 cursos" a la vista con catálogo vacío.
- [x] **Testimonios** — misma disciplina anti-fabricación que las estadísticas: tabla real
      `testimonials` (`nombre`, `rol`, `texto`), gestionada solo desde `/admin`
      (`AdminTestimonialsManager`, pestaña "Configuración") vía `src/server/testimonials.ts` y
      `src/server/actions/testimonials.ts`. `TestimonialsSection` (`src/components/
      testimonials-section.tsx`) devuelve `null` si la lista viene vacía — nunca se muestran
      testimonios de ejemplo ni generados. Probado en el navegador: crear/borrar testimonio desde
      el admin refleja en `/` de inmediato (`revalidatePath` en ambas rutas).
- [x] **FAQ** — `FaqAccordion` (`src/components/faq-accordion.tsx`), 5 preguntas reales sobre el
      producto (contenido fijo en código, no editable desde admin todavía — es contenido
      institucional estable, no dato transaccional; si hace falta editarlo sin deploy, ese es el
      punto a mover a DB más adelante). Acordeón de una sola pregunta abierta a la vez, animado con
      `AnimatePresence`.
- [x] **Animaciones/transiciones con `motion`** (paquete `motion`, sucesor de Framer Motion) en
      toda la landing: `Button`/`ProgressBar` (`src/components/ui.tsx`) ahora son `motion.button`/
      `motion.div` con hover/tap; `ScrollReveal`/`StaggerGroup`/`StaggerItem`
      (`src/components/scroll-reveal.tsx`) envuelven las secciones con revelado al hacer scroll
      (`whileInView`); `AnimatedCounter` (`src/components/animated-counter.tsx`) anima el conteo de
      las estadísticas desde 0 hasta el valor real la primera vez que entra en viewport —
      implementado con el patrón `onViewportEnter` + `animate()` imperativo de `motion/react` (más
      robusto que `useInView` + `useEffect`, que se probó primero y no disparaba de forma
      consistente). **Nota de verificación:** en el panel de navegador de este entorno de
      automatización, el contador puede quedarse en `0` visualmente porque el panel no está
      "compositing frames" cuando no está en primer plano — el bucle `requestAnimationFrame` que
      usa `animate()` queda pausado por el navegador. No es un bug de la app; confirmar el conteo
      en un navegador real si vuelve a dudarse.
      Deliberadamente **sin cifras de uso ni testimonios inventados** en ningún momento de esta
      ronda — todo el "prueba social" sale de datos reales o queda oculto.
- [x] **Secciones dinámicas reemplazan "Bloque A"/"Bloque B" fijo** — antes estaba hardcodeado en
      todo el frontend (7 archivos). Ahora `sections` es una tabla real (`id`, `nombre`, `orden`)
      que el admin crea/renombra/elimina desde `/admin` (`AdminSectionsManager`, arriba de la
      tabla de cursos). `courses.sectionId` referencia `sections.id` con `onDelete: "set null"` —
      **borrar una sección nunca borra ni oculta sus cursos**, quedan bajo "Sin sección"
      (verificado en el navegador: crear sección → asignarla a un curso → catálogo público la
      muestra con ese nombre → borrar la sección → el curso reaparece bajo "Sin sección", nunca
      desaparece). El bundle de la home ahora usa la primera sección por `orden`, no un "Bloque A"
      fijo. `Course.seccionNombre` viene ya resuelto desde `src/server/courses.ts`
      (`sectionNameMap()`) para no repetir el join en cada componente.
      **Nota de migración:** esto forzó reiniciar el historial de migraciones de Drizzle
      (`drizzle/`) desde cero — drizzle-kit pedía un prompt interactivo (rename vs. drop+add) que
      no se puede responder en este entorno, y editar snapshots a mano ya había fallado una vez
      antes. Como la DB de desarrollo se mantiene deliberadamente en blanco, fue más seguro
      recrear el esquema base que seguir parchando JSON de snapshots. La cuenta de superadmin se
      recreó con `scripts/create-admin.ts` después — si esto vuelve a pasar, ese es el patrón a
      seguir (nunca en una base con datos reales de producción).
- [x] Facturación electrónica vía Alegra — **conectada y verificada de punta a punta** contra la
      cuenta real de GEIFEM: `confirmCheckout` (`src/server/checkout.ts`) llama a
      `invoicePayment` al marcar un pago "pagado", que busca/crea el contacto en Alegra
      (`findOrCreateContact`) y crea la factura (`createInvoice`, `src/server/alegra.ts`) bajo la
      resolución DIAN electrónica real (`numberTemplate id "15"`, prefijo `FV`), con el ítem
      dedicado "Curso Academia" (`id "3"`, IVA 19%). Si falta el documento de identidad del
      comprador, la facturación falla mostrando error en logs **pero el pago queda igual
      marcado como pagado** — nunca bloquear el acceso al curso por un problema de facturación.
      Probado simulando el webhook completo de ePayco (firma válida) contra el servidor local: el
      pago pasó a "pagado", la matrícula se activó, y se creó la factura real `FV203` en Alegra.
      **Bug real encontrado y corregido en el camino:** Alegra NO aplica el impuesto por defecto
      configurado en el ítem al crear una factura — hay que pasar `tax: [{id}]` explícito en cada
      línea, si no la factura queda sin IVA (pasó en la primera prueba, `FV203` inicialmente sin
      IVA). Corregido en `createInvoice`. También: el precio que paga el estudiante es el precio
      final (IVA incluido) — `createInvoice` calcula el valor base sin IVA
      (`precioTotal / 1.19`) para que el total de la factura coincida exactamente con lo cobrado
      (verificado: $35.000 cobrados → factura con subtotal $29.412 + IVA $5.588 = $35.000).
      **Aviso pendiente para el usuario:** las pruebas dejaron 2 facturas de prueba reales en la
      cuenta de Alegra de GEIFEM (`FV203`, `FV204`, $35.000 cada una, a nombre de Carlos Vega,
      estado "open", sin `stamp` de la DIAN todavía visible vía API) — preguntar si se anulan o
      se dejan.
- [x] Documento de identidad del comprador — `user.identificationType` /
      `user.identificationNumber` (migración `0003`), editable en `/cuenta`
      (`src/components/billing-info-form.tsx`, vía `authClient.updateUser` — requiere el plugin
      `inferAdditionalFields` en `src/lib/auth-client.ts` para que TypeScript conozca los campos
      extra). `startCheckoutAction` bloquea el pago si falta (`error: "missing_identification"`),
      con enlace directo a `/cuenta` desde `/carrito`.
- [x] Tope regulatorio de 120h para formación no formal (ETDH) en Colombia — validado en
      `buildDescripcion` (`src/server/alegra.ts`) antes de facturar; si el curso declara más de
      120h, `createInvoice` lanza error y no factura. Es una validación tardía (al momento de
      facturar) porque `duracionHoras` es texto libre en el admin, no un campo numérico — sería
      mejor detectarlo al crear/editar el curso, no solo al facturar; queda como mejora pendiente.

**Actualizar esta sección y las anteriores a medida que se completen fases — no dejarla
desactualizada.**
