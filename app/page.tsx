"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const WELCOME_KEY = "vaticine_welcome_dismissed_v1";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(WELCOME_KEY) === "1";
      router.replace(dismissed ? "/boleta" : "/bienvenida");
    } catch {
      router.replace("/bienvenida");
    }
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="text-white/70">Cargando…</div>
    </main>
  );
}
