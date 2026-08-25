"use client";

import { useState } from "react";
import { motion, animate } from "motion/react";

export function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);

  return (
    <motion.span
      onViewportEnter={() => {
        if (started) return;
        setStarted(true);
        animate(0, value, {
          duration: 1,
          ease: "easeOut",
          onUpdate: (v) => setDisplay(Math.round(v)),
        });
      }}
      viewport={{ once: true, amount: 0.3 }}
    >
      {display}
      {suffix}
    </motion.span>
  );
}
