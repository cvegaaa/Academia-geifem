"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  pregunta: string;
  respuesta: string;
}

const FAQS: FaqItem[] = [
  {
    pregunta: "¿Necesito experiencia previa para tomar un curso?",
    respuesta:
      "No. Los cursos están pensados para empezar desde cero, con ejercicios prácticos paso a paso.",
  },
  {
    pregunta: "¿Cuánto tiempo tengo para completar un curso?",
    respuesta:
      "El acceso es de por vida una vez compras — avanzas a tu propio ritmo, sin fecha límite.",
  },
  {
    pregunta: "¿Cómo recibo mi certificado?",
    respuesta:
      "Al completar todas las unidades y aprobar sus evaluaciones, el certificado se genera automáticamente y queda disponible para descargar, con un código de verificación pública.",
  },
  {
    pregunta: "¿Qué medios de pago aceptan?",
    respuesta: "PSE, tarjeta de crédito/débito y Nequi/Daviplata, a través de ePayco.",
  },
  {
    pregunta: "¿Cómo funciona la beca de GEIFEM?",
    respuesta:
      "Un porcentaje de cada matrícula paga financia cupos gratuitos para jóvenes que no pueden pagar, priorizando colegios públicos aliados.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      {FAQS.map((faq, i) => {
        const open = openIndex === i;
        return (
          <div key={faq.pregunta} className="overflow-hidden rounded-xl border border-border bg-surface">
            <button
              onClick={() => setOpenIndex(open ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
            >
              <span className="font-medium text-ink">{faq.pregunta}</span>
              <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={18} className="shrink-0 text-ink-soft" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <p className="px-4 pb-4 text-sm text-ink-soft">{faq.respuesta}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
