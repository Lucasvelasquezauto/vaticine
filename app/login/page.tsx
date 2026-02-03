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
        router.replace("/");
        return;
      }
      setCheckingSession(false);
    })();
  }, [router, supabase]);

  async function signInGoogle() {
    setMsg(null);
    setLoading(true);

    const cleanName = name.trim();
    if (cleanName && cleanName.length >= 2) {
      localStorage.setItem("vaticine_name", cleanName);
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setMsg(`Error: ${error.message}`);
    }
    // Si no hay error, Supabase redirige a Google automáticamente.
  }

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
          Puedes entrar con Google o por correo (sin contraseña).
        </p>

        <div className="mt-6 space-y-4">
          <button
            type="button"
            disabled={loading}
            onClick={signInGoogle}
            className="w-full rounded-xl bg-[#DB4437] text-white py-2 font-medium disabled:opacity-60 hover:opacity-95"
          >
            {loading ? "Abriendo Google..." : "Continuar con Google"}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <div className="text-xs text-white/50">o</div>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form className="space-y-4" onSubmit={sendCode}>
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
              {loading ? "Enviando..." : "Enviar acceso por correo"}
            </button>
          </form>
        </div>

        {msg && (
          <p className="mt-4 text-sm text-white/80 rounded-xl border border-white/10 bg-black/40 p-3">
            {msg}
          </p>
        )}
      </div>
    </main>
  );
}

