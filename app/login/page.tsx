"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../src/lib/supabase/client";


export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // Ya hay sesión: mandamos a la app (por ahora /, luego será /boleta)
        router.replace("/");
        return;
      }
      setCheckingSession(false);
    })();
  }, [router, supabase]);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length < 2) {
      setMsg("Escribe tu nombre (mínimo 2 caracteres).");
      return;
    }
    if (!cleanEmail.includes("@")) {
      setMsg("Escribe un correo válido.");
      return;
    }

    setLoading(true);
    localStorage.setItem("vaticine_name", cleanName);

    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setMsg(`Error: ${error.message}`);
      return;
    }

    setMsg("Listo: revisa tu correo. Te llegó un acceso para entrar.");
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-white/70">Verificando sesión…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/30 p-6 shadow">
        <h1 className="text-2xl font-semibold">Entrar a Vaticine</h1>
        <p className="mt-2 text-sm text-white/70">
          Sin contraseña. Te enviamos un acceso al correo.
        </p>

        <form className="mt-6 space-y-4" onSubmit={sendCode}>
          <div>
            <label className="text-sm text-white/80">Nombre</label>
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="text-sm text-white/80">Correo</label>
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              autoComplete="email"
            />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-white text-black py-2 font-medium disabled:opacity-60"
          >
            {loading ? "Enviando..." : "Enviar acceso"}
          </button>
        </form>

        {msg && (
          <p className="mt-4 text-sm text-white/80 rounded-xl border border-white/10 bg-black/40 p-3">
            {msg}
          </p>
        )}
      </div>
    </main>
  );
}