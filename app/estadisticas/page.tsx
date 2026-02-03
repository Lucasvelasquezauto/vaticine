import { Suspense } from "react";
import StatsClient from "./StatsClient";

export default function EstadisticasPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center p-6">
          <div className="text-white/70">Cargando…</div>
        </main>
      }
    >
      <StatsClient />
    </Suspense>
  );
}
