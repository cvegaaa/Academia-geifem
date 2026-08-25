import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const MAX_SIZE_BYTES = 15 * 1024 * 1024;
const ALLOWED_EXTENSIONS: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.oasis.opendocument.text": "odt",
  "text/plain": "txt",
};

// Material escrito de una unidad — ver arquitectura-academia § "Material escrito con archivo
// adjunto". Guarda en disco local (public/uploads/materiales), suficiente para el despliegue
// autoalojado de un solo contenedor; si se escala a múltiples instancias hay que migrar a un
// bucket (S3/R2) — no antes, YAGNI.
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: { code: "no_file", message: "Falta el archivo" } }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { ok: false, error: { code: "too_large", message: "El archivo supera los 15MB permitidos" } },
      { status: 400 },
    );
  }

  const extension = ALLOWED_EXTENSIONS[file.type];
  if (!extension) {
    return NextResponse.json(
      { ok: false, error: { code: "unsupported_type", message: "Tipo de archivo no permitido (PDF, Word, ODT o TXT)" } },
      { status: 400 },
    );
  }

  const dir = path.join(process.cwd(), "public", "uploads", "materiales");
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return NextResponse.json({
    ok: true,
    data: { url: `/uploads/materiales/${filename}`, nombre: file.name },
  });
}
