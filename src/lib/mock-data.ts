// Catálogo de referencia usado solo por scripts/seed.ts para poblar datos de prueba en
// desarrollo. La app en sí ya no lee de aquí — ver src/server/courses.ts (fuente real, DB) y
// arquitectura-academia § "Contenido real vs. datos de semilla".
//
// seccionId siempre null aquí — scripts/seed.ts resuelve/crea la sección real por seccionNombre
// antes de insertar el curso (no hay ids de sección de mentira, serían falsos).

import type { Course, Question, Unit } from "@/lib/types";

export type { Course, Question, QuestionType, Unit } from "@/lib/types";

const evaluacionEjemplo = (tema: string): Question[] => [
  {
    id: "q1",
    type: "unica",
    enunciado: `¿Cuál opción describe mejor el uso correcto de ${tema} en esta unidad?`,
    opciones: ["Opción A", "Opción B", "Opción C", "Opción D"],
    correctas: [1],
  },
  {
    id: "q2",
    type: "vf",
    enunciado: `Es correcto aplicar lo visto en esta unidad de ${tema} en un documento real de trabajo.`,
    opciones: ["Verdadero", "Falso"],
    correctas: [0],
  },
  {
    id: "q3",
    type: "multiple",
    enunciado: `¿Cuáles de las siguientes son buenas prácticas al trabajar con ${tema}? (elige todas las que apliquen)`,
    opciones: ["Práctica correcta 1", "Error común", "Práctica correcta 2", "Otro error común"],
    correctas: [0, 2],
  },
];

const unidadesExcel: Unit[] = [
  {
    id: "u1",
    titulo: "Primeros pasos: filas, columnas y fórmulas básicas",
    orden: 1,
    materialEscrito: {
      titulo: "Guía: la interfaz de Excel y tus primeras fórmulas",
      resumen: "Cómo moverte en la hoja de cálculo, escribir datos y usar SUMA, PROMEDIO y CONTAR.",
    },
    videoRefuerzo: { titulo: "Tour por Excel para principiantes", youtubeId: "dQw4w9WgXcQ", duracion: "8:12" },
    videoEjercicio: { titulo: "Ejercicio: arma tu primera hoja de gastos", youtubeId: "dQw4w9WgXcQ", duracion: "6:40" },
    evaluacion: { titulo: "Evaluación — Unidad 1", preguntas: evaluacionEjemplo("fórmulas básicas") },
  },
  {
    id: "u2",
    titulo: "Tablas y formato profesional",
    orden: 2,
    materialEscrito: {
      titulo: "Guía: convertir tus datos en una tabla ordenada",
      resumen: "Formato de tabla, filtros, ordenar datos y dar formato condicional.",
    },
    videoRefuerzo: { titulo: "Tablas en Excel paso a paso", youtubeId: "dQw4w9WgXcQ", duracion: "7:05" },
    videoEjercicio: { titulo: "Ejercicio: organiza una lista de gastos del mes", youtubeId: "dQw4w9WgXcQ", duracion: "5:30" },
    evaluacion: { titulo: "Evaluación — Unidad 2", preguntas: evaluacionEjemplo("tablas y formato") },
  },
  {
    id: "u3",
    titulo: "Gráficos que comunican",
    orden: 3,
    materialEscrito: {
      titulo: "Guía: elegir el gráfico correcto para tus datos",
      resumen: "Gráficos de barras, líneas y pastel — cuándo usar cada uno.",
    },
    videoRefuerzo: { titulo: "Cómo crear gráficos claros", youtubeId: "dQw4w9WgXcQ", duracion: "6:55" },
    videoEjercicio: { titulo: "Ejercicio: visualiza tus gastos mensuales", youtubeId: "dQw4w9WgXcQ", duracion: "5:10" },
    evaluacion: { titulo: "Evaluación — Unidad 3", preguntas: evaluacionEjemplo("gráficos") },
  },
  {
    id: "u4",
    titulo: "Hoja de gastos final: tu proyecto práctico",
    orden: 4,
    materialEscrito: {
      titulo: "Guía: arma tu hoja de gastos personales de principio a fin",
      resumen: "Une todo lo aprendido en un solo archivo listo para usar en tu vida real.",
    },
    videoRefuerzo: { titulo: "Repaso general antes del proyecto final", youtubeId: "dQw4w9WgXcQ", duracion: "9:20" },
    videoEjercicio: { titulo: "Ejercicio final: tu hoja de gastos completa", youtubeId: "dQw4w9WgXcQ", duracion: "10:00" },
    evaluacion: { titulo: "Evaluación final", preguntas: evaluacionEjemplo("tu proyecto final") },
  },
];

export const courses: Course[] = [
  {
    slug: "excel-desde-cero",
    titulo: "Excel desde cero",
    seccionId: null,
    seccionNombre: "Ofimática esencial",
    resumen: "Fórmulas, tablas y gráficos para el trabajo diario.",
    descripcion:
      "Aprende a usar Excel para tareas reales de oficina: organizar información, hacer cálculos automáticos y presentar tus datos con gráficos claros. Curso 100% práctico, pensado para tu primer empleo.",
    precio: 35000,
    duracionHoras: 4,
    estudiantes: 128,
    categorias: ["Ofimática", "Excel"],
    unidades: unidadesExcel,
  },
  {
    slug: "word-profesional",
    titulo: "Word profesional",
    seccionId: null,
    seccionNombre: "Ofimática esencial",
    resumen: "Cartas, hojas de vida e informes bien presentados.",
    descripcion:
      "Domina Word para producir documentos con presentación profesional: cartas formales, tu hoja de vida y reportes de trabajo bien estructurados.",
    precio: 30000,
    duracionHoras: 3,
    estudiantes: 96,
    categorias: ["Ofimática", "Word"],
    unidades: unidadesExcel.map((u, i) => ({ ...u, id: `w${i + 1}`, titulo: u.titulo.replace("Excel", "Word") })),
  },
  {
    slug: "powerpoint-con-impacto",
    titulo: "PowerPoint para presentar ideas con impacto",
    seccionId: null,
    seccionNombre: "Ofimática esencial",
    resumen: "Presentaciones claras y visualmente efectivas.",
    descripcion: "Aprende a estructurar y diseñar presentaciones que se entiendan y se recuerden.",
    precio: 30000,
    duracionHoras: 3,
    estudiantes: 74,
    categorias: ["Ofimática", "PowerPoint"],
    unidades: unidadesExcel.map((u, i) => ({ ...u, id: `p${i + 1}` })),
  },
  {
    slug: "google-workspace",
    titulo: "Google Workspace para el trabajo remoto",
    seccionId: null,
    seccionNombre: "Ofimática esencial",
    resumen: "Docs, Sheets, Gmail y Drive para tu día a día.",
    descripcion: "Las herramientas de Google que la mayoría de empresas usan hoy — de cero a productivo.",
    precio: 30000,
    duracionHoras: 3,
    estudiantes: 51,
    categorias: ["Ofimática", "Google Workspace"],
    unidades: unidadesExcel.map((u, i) => ({ ...u, id: `g${i + 1}` })),
  },
  {
    slug: "hoja-de-vida-linkedin",
    titulo: "Hoja de vida y LinkedIn que consiguen entrevistas",
    seccionId: null,
    seccionNombre: "Habilidades laborales complementarias",
    resumen: "Construye un perfil que te abra puertas.",
    descripcion: "Cómo armar una hoja de vida y un perfil de LinkedIn que capten la atención de reclutadores.",
    precio: 25000,
    duracionHoras: 2,
    estudiantes: 40,
    categorias: ["Habilidades laborales", "Empleabilidad"],
    unidades: unidadesExcel.map((u, i) => ({ ...u, id: `h${i + 1}` })),
  },
  {
    slug: "comunicacion-y-atencion-al-cliente",
    titulo: "Comunicación efectiva y atención al cliente",
    seccionId: null,
    seccionNombre: "Habilidades laborales complementarias",
    resumen: "Habilidades blandas que el mercado pide.",
    descripcion: "Herramientas prácticas para comunicarte mejor y atender clientes con profesionalismo.",
    precio: 25000,
    duracionHoras: 2,
    estudiantes: 33,
    categorias: ["Habilidades laborales", "Comunicación"],
    unidades: unidadesExcel.map((u, i) => ({ ...u, id: `c${i + 1}` })),
  },
];

export const becasStats = {
  matriculasPagas: 42,
  becasOtorgadas: 4,
  cupoDisponible: 1,
};
