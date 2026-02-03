"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../src/lib/supabase/client";

export default function CuentaPage() {
  const router = useRouter();

  // Crear el cliente una sola vez (evita comportamientos raros)
  const supabase = useMemo(() => createClient(), []);

  const [status, setStatus] = useState<"checking" | "logged" | "guest">("checking");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user ?? null;

      if (cancelled) return;

      if (!user) {
        setStatus("guest");
        router.replace("/login");
        return;
      }

      setEmail(user.email ?? null);
      setStatus("logged");
    })();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (status === "checking") {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-white/70">Cargando…</div>
      </main>
    );
  }

  if (status === "guest") {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-white/70">Redirigiendo a login…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-black/30 p-6 shadow">
        <h1 className="text-2xl font-semibold">vatiCINE</h1>

        <p className="mt-2 text-white/70">Sesión activa{email ? `: ${email}` : "."}</p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            className="w-full rounded-xl bg-white text-black py-2 font-medium"
            onClick={() => router.push("/boleta")}
          >
            Ir a la Boleta
          </button>

          <button
            className="w-full rounded-xl border border-white/15 bg-black/40 py-2 font-medium"
            onClick={logout}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </main>
  );
}
