// Tipos de dominio compartidos entre servidor (src/server/courses.ts) y cliente (componentes
// de admin/estudiante/catálogo). La forma no cambia si el dato viene de mock-data.ts (seed/dev)
// o de la base de datos real — src/server/courses.ts mapea las filas de Drizzle a esta forma.

export type QuestionType = "unica" | "multiple" | "vf";

export interface Question {
  id: string;
  type: QuestionType;
  enunciado: string;
  opciones: string[];
  correctas: number[];
}

export interface Unit {
  id: string;
  titulo: string;
  orden: number;
  materialEscrito: { titulo: string; resumen: string; archivoUrl?: string | null; archivoNombre?: string | null };
  videoRefuerzo: { titulo: string; youtubeId: string; duracion: string };
  videoEjercicio: { titulo: string; youtubeId: string; duracion: string };
  evaluacion: { titulo: string; preguntas: Question[] };
}

export interface Section {
  id: string;
  nombre: string;
  orden: number;
}

export interface Course {
  slug: string;
  titulo: string;
  seccionId: string | null;
  seccionNombre: string;
  resumen: string;
  descripcion: string;
  precio: number;
  duracionHoras: string;
  estudiantes: number;
  categorias: string[];
  unidades: Unit[];
}
