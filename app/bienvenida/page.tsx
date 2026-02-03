"use client";

import { useRouter } from "next/navigation";
import { InstructionsList } from "../../src/components/vaticine/InstructionsList";

const WELCOME_KEY = "vaticine_welcome_dismissed_v1";

export default function BienvenidaPage() {
  const router = useRouter();

  function dismissAndGo(href: string) {
    try {
      localStorage.setItem(WELCOME_KEY, "1");
    } catch {}
    router.push(href);
  }

  return (
    <main className="mx-auto w-full max-w-3xl p-4">
      <div className="rounded-2xl border border-white/10 bg-black/35 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_18px_55px_rgba(0,0,0,0.55)]">
        <div className="text-[22px] font-semibold tracking-tight text-white">Bienvenido a vatiCINE</div>

        <div className="mt-3">
          <InstructionsList />
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-white px-4 text-[15px] font-semibold text-black hover:bg-white/90 active:scale-[0.99] transition"
            onClick={() => dismissAndGo("/boleta")}
          >
            Empezar
          </button>

          <button
            type="button"
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-white/15 bg-black/40 px-4 text-[15px] font-semibold text-white hover:border-white/25 hover:bg-white/5 active:scale-[0.99] transition"
            onClick={() => dismissAndGo("/login")}
          >
            Iniciar sesión para guardar
          </button>
        </div>
      </div>
    </main>
  );
}
