"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui";

// Sin librería de generación de PDF en el servidor (YAGNI para el MVP) — el navegador ya sabe
// convertir HTML a PDF vía su diálogo de impresión; el certificado tiene estilos `print:` para
// que se vea limpio en ese modo (sin fondos decorativos, sin los botones de esta barra).
export function DownloadCertificateButton() {
  return (
    <Button onClick={() => window.print()}>
      <Download size={16} /> Descargar PDF
    </Button>
  );
}
