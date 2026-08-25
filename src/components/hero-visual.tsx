"use client";

import { motion } from "motion/react";
import { Award, FileSpreadsheet, GraduationCap, PlayCircle } from "lucide-react";

// Composición abstracta con íconos, no fotos de "estudiantes" genéricas — evita implicar
// testimonios/personas reales que no existen. Ver arquitectura-academia § Landing.
const CARDS = [
  { icon: FileSpreadsheet, label: "Excel", className: "left-2 top-6 sm:left-6", delay: 0 },
  { icon: PlayCircle, label: "Video práctico", className: "right-2 top-0 sm:right-4", delay: 0.15 },
  { icon: Award, label: "Certificado", className: "left-6 bottom-4 sm:left-10", delay: 0.3 },
  { icon: GraduationCap, label: "Academia", className: "right-6 bottom-8 sm:right-10", delay: 0.45 },
];

export function HeroVisual() {
  return (
    <div className="relative mx-auto h-72 w-full max-w-sm sm:h-80">
      <motion.div
        className="absolute inset-6 rounded-[2.5rem] bg-gradient-to-br from-brand-100 via-brand-50 to-accent-100"
        animate={{ rotate: [0, 2, 0, -2, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      {CARDS.map(({ icon: Icon, label, className, delay }) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 + delay }}
          whileHover={{ y: -4 }}
          className={`absolute flex items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2 shadow-md ${className}`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Icon size={16} />
          </span>
          <span className="text-xs font-semibold text-ink">{label}</span>
        </motion.div>
      ))}
    </div>
  );
}
