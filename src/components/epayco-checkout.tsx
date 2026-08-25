"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    ePayco?: {
      checkout: {
        configure: (opts: { sessionId: string; test: boolean }) => {
          open: () => void;
        };
      };
    };
  }
}

const SCRIPT_SRC = "https://checkout.epayco.co/checkout-v2.js";

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.ePayco) return resolve();
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar el checkout de ePayco"));
    document.body.appendChild(script);
  });
}

export function useEpaycoCheckout() {
  const ready = useRef(false);

  useEffect(() => {
    loadScript()
      .then(() => {
        ready.current = true;
      })
      .catch(() => {});
  }, []);

  return async function openCheckout(sessionId: string, testMode: boolean) {
    await loadScript();
    if (!window.ePayco) throw new Error("ePayco no cargó correctamente");
    window.ePayco.checkout.configure({ sessionId, test: testMode }).open();
  };
}
