import { boolean, check, integer, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// --- Identidad (better-auth) -------------------------------------------------------------
// Mismo patrón que geifem-agentes: better-auth reutiliza estas 4 tablas vía drizzleAdapter.
// `role` es el campo propio de Academia (additionalField en src/lib/auth.ts).

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    name: text("name").notNull(),
    image: text("image"),
    // superadmin: mismos permisos que admin hoy + a futuro (fase 2) crear/administrar
    // organizaciones cuando la plataforma se venda a terceros que quieran sus propias
    // capacitaciones white-label. No hay tabla de organizaciones todavía — es un rol reservado,
    // sin funcionalidad propia adicional por ahora. instructor: definido en el plan original
    // (crea/edita contenido, sin acceso a pagos/becas) pero sin gating propio implementado
    // todavía — nada lo usa hoy.
    role: text("role").notNull().default("estudiante"),
    // Documento de identidad — obligatorio antes de poder facturar en Alegra (factura
    // electrónica DIAN exige identificación del comprador). Nulo hasta que el estudiante lo
    // complete; ver src/server/actions/profile.ts.
    identificationType: text("identification_type"),
    identificationNumber: text("identification_number"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("user_role_check", sql`${t.role} in ('superadmin', 'admin', 'instructor', 'estudiante')`),
    check(
      "user_identification_type_check",
      sql`${t.identificationType} is null or ${t.identificationType} in ('CC', 'NIT', 'CE', 'PA')`,
    ),
  ],
);

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  issuer: text("issuer").notNull(),
  password: text("password"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// --- Contenido ----------------------------------------------------------------------------
// Dinero siempre en centavos (integer), nunca float — mismo criterio que geifem-agentes.

// Secciones que agrupan cursos en el catálogo (antes "Bloque A"/"Bloque B" hardcodeado) — el
// admin las crea, renombra, reordena y elimina desde el panel. Un curso sin sección asignada
// (sectionId null) se muestra bajo "Sin sección" en el catálogo, nunca desaparece.
export const sections = pgTable("sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull(),
  orden: integer("orden").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    titulo: text("titulo").notNull(),
    sectionId: uuid("section_id").references(() => sections.id, { onDelete: "set null" }),
    resumen: text("resumen").notNull().default(""),
    descripcion: text("descripcion").notNull().default(""),
    precioCents: integer("precio_cents").notNull().default(0),
    // Estructurado (no texto libre) para poder validar el tope regulatorio de 120h (formación
    // no formal / ETDH en Colombia) al guardar el curso, no solo al facturar — y para mostrarla
    // igual en catálogo, ficha, factura y certificado sin parsear texto en ningún lado.
    duracionHoras: integer("duracion_horas").notNull().default(0),
    estado: text("estado").notNull().default("borrador"),
    // Etiquetas libres de categoría (ej. "Excel", "Habilidades blandas") — texto libre con
    // autocompletado desde las ya usadas, no una tabla de categorías separada (YAGNI: el
    // catálogo es chico, no hace falta gestión centralizada todavía).
    categorias: jsonb("categorias").notNull().default([]).$type<string[]>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("courses_estado_check", sql`${t.estado} in ('borrador', 'publicado')`),
    check("courses_duracion_horas_check", sql`${t.duracionHoras} >= 0 and ${t.duracionHoras} <= 120`),
  ],
);

// Cada unidad tiene, por estructura, exactamente 1 material escrito, 1 video de refuerzo y
// 1 video de ejercicio — no son listas, así que viven como columnas de la unidad en vez de
// tablas hijas. La cantidad de unidades por curso sí es libre (fila por unidad).
export const units = pgTable(
  "units",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    titulo: text("titulo").notNull(),
    orden: integer("orden").notNull(),

    materialTitulo: text("material_titulo").notNull().default(""),
    materialContenido: text("material_contenido").notNull().default(""),
    // Archivo adjunto opcional (PDF u otro documento) subido desde el admin — guardado en disco
    // bajo public/uploads/materiales, ver src/app/api/uploads/route.ts.
    materialArchivoUrl: text("material_archivo_url"),
    materialArchivoNombre: text("material_archivo_nombre"),

    videoRefuerzoTitulo: text("video_refuerzo_titulo").notNull().default(""),
    videoRefuerzoYoutubeId: text("video_refuerzo_youtube_id").notNull().default(""),
    videoRefuerzoDuracion: text("video_refuerzo_duracion").notNull().default(""),

    videoEjercicioTitulo: text("video_ejercicio_titulo").notNull().default(""),
    videoEjercicioYoutubeId: text("video_ejercicio_youtube_id").notNull().default(""),
    videoEjercicioDuracion: text("video_ejercicio_duracion").notNull().default(""),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("units_course_orden_unique").on(t.courseId, t.orden)],
);

export const assessments = pgTable("assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  unitId: uuid("unit_id")
    .notNull()
    .unique()
    .references(() => units.id, { onDelete: "cascade" }),
  titulo: text("titulo").notNull().default("Evaluación"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const assessmentQuestions = pgTable(
  "assessment_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    orden: integer("orden").notNull(),
    tipo: text("tipo").notNull(),
    enunciado: text("enunciado").notNull(),
    opciones: jsonb("opciones").notNull().$type<string[]>(),
    correctas: jsonb("correctas").notNull().$type<number[]>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("assessment_questions_tipo_check", sql`${t.tipo} in ('unica', 'multiple', 'vf')`)],
);

// --- Matrícula, pagos y progreso ------------------------------------------------------------

// Cupones de descuento — creados y desactivados solo desde /admin. `valor` se interpreta según
// `tipo`: para "porcentaje" es 1-100, para "fijo" son centavos. `usosActuales` se incrementa una
// vez por checkout confirmado como pagado (no por curso ni por intento abandonado) en
// src/server/checkout.ts.
export const coupons = pgTable(
  "coupons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    codigo: text("codigo").notNull().unique(),
    tipo: text("tipo").notNull(),
    valor: integer("valor").notNull(),
    activo: boolean("activo").notNull().default(true),
    usosMaximos: integer("usos_maximos"),
    usosActuales: integer("usos_actuales").notNull().default(0),
    fechaExpiracion: timestamp("fecha_expiracion", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("coupons_tipo_check", sql`${t.tipo} in ('porcentaje', 'fijo')`),
    check("coupons_valor_check", sql`${t.valor} > 0`),
  ],
);

export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    estadoPago: text("estado_pago").notNull().default("pendiente"),
    porcentajeCompletado: integer("porcentaje_completado").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("enrollments_user_course_unique").on(t.userId, t.courseId),
    check("enrollments_estado_pago_check", sql`${t.estadoPago} in ('pendiente', 'pagado', 'fallido')`),
  ],
);

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  enrollmentId: uuid("enrollment_id")
    .notNull()
    .references(() => enrollments.id, { onDelete: "cascade" }),
  referenciaEpayco: text("referencia_epayco"),
  // Monto ya con el descuento del cupón aplicado (si hubo uno) — es lo que se cobra
  // efectivamente y lo que se factura en Alegra, para no tener que recalcular en ningún lado.
  montoCents: integer("monto_cents").notNull(),
  // Cupón aplicado a este pago (si hubo). Se conserva aunque el cupón se borre después
  // (onDelete: set null) para no perder el historial de cuánto se cobró — descuentoCents ya
  // quedó guardado con el número real, no depende de que el cupón siga existiendo.
  couponId: uuid("coupon_id").references(() => coupons.id, { onDelete: "set null" }),
  descuentoCents: integer("descuento_cents").notNull().default(0),
  estado: text("estado").notNull().default("pendiente"),
  facturaAlegraId: text("factura_alegra_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const progress = pgTable(
  "progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => enrollments.id, { onDelete: "cascade" }),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    materialVisto: boolean("material_visto").notNull().default(false),
    videoRefuerzoVisto: boolean("video_refuerzo_visto").notNull().default(false),
    videoEjercicioVisto: boolean("video_ejercicio_visto").notNull().default(false),
    evaluacionAprobada: boolean("evaluacion_aprobada").notNull().default(false),
    puntaje: integer("puntaje"),
  },
  (t) => [unique("progress_enrollment_unit_unique").on(t.enrollmentId, t.unitId)],
);

// --- Certificados y becas -------------------------------------------------------------------

export const certificates = pgTable("certificates", {
  id: uuid("id").primaryKey().defaultRandom(),
  enrollmentId: uuid("enrollment_id")
    .notNull()
    .unique()
    .references(() => enrollments.id, { onDelete: "cascade" }),
  codigoVerificacion: text("codigo_verificacion").notNull().unique(),
  fechaEmision: timestamp("fecha_emision", { withTimezone: true }).notNull().defaultNow(),
  urlPdf: text("url_pdf"),
});

// Becas GEIFEM — administradas solo por superadmin (src/server/actions/require-superadmin.ts).
// Cada fila es una beca YA otorgada (no un "cupo pendiente" separado) — el cupo disponible para
// asignar se calcula en src/server/becas.ts a partir del % de matrículas pagas menos las ya
// otorgadas, nunca se guarda como número aparte que pueda desincronizarse.
export const scholarships = pgTable("scholarships", {
  id: uuid("id").primaryKey().defaultRandom(),
  beneficiarioNombre: text("beneficiario_nombre").notNull(),
  criterio: text("criterio").notNull().default(""),
  courseId: uuid("course_id").references(() => courses.id, { onDelete: "set null" }),
  fechaAsignacion: timestamp("fecha_asignacion", { withTimezone: true }).notNull().defaultNow(),
});

// Testimonios de la landing — SIEMPRE reales, escritos por el admin desde /admin. Nunca se
// generan por código ni se inventan por IA: un testimonio falso presentado como genuino en un
// sitio de venta real es exactamente el tipo de contenido fabricado que no se debe publicar. La
// sección en el frontend se oculta sola si esta tabla está vacía — nunca hay "0 testimonios de
// ejemplo" a la vista.
export const testimonials = pgTable("testimonials", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull(),
  rol: text("rol").notNull().default(""),
  texto: text("texto").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
