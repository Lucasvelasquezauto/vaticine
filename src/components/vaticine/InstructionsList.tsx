"use client";

import React from "react";

function EyeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M2.5 12s3.6-7 9.5-7 9.5 7 9.5 7-3.6 7-9.5 7S2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" fill="currentColor" />
    </svg>
  );
}

function StatsIcon({ className = "" }: { className?: string }) {
  return (
    <span className={"flex items-end gap-1 " + className} aria-hidden="true">
      <span className="h-3.5 w-1.5 rounded-full bg-gradient-to-b from-sky-300 to-sky-500 shadow-[0_0_12px_rgba(56,189,248,0.35)]" />
      <span className="h-6 w-1.5 rounded-full bg-gradient-to-b from-indigo-300 to-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.35)]" />
      <span className="h-4.5 w-1.5 rounded-full bg-gradient-to-b from-fuchsia-300 to-fuchsia-500 shadow-[0_0_12px_rgba(232,121,249,0.35)]" />
    </span>
  );
}

export function InstructionsList() {
  return (
    <ul className="grid gap-3 text-[15px] leading-relaxed text-white/85">
      <li className="flex gap-3">
        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
        <span>
          Bienvenido a <span className="font-semibold text-white">vatiCINE</span>, el lugar para evaluar qué tan
          cercano es tu criterio al de los jueces de los premios Oscar.
        </span>
      </li>

      <li className="flex gap-3">
        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
        <span>
          Escoge cuál película crees que va a ganar y cuál es tu segunda opción en cada categoría. Al final daremos{" "}
          <span className="font-semibold text-white">100 puntos</span> si aciertas con la primera y{" "}
          <span className="font-semibold text-white">50</span> si aciertas con la segunda.
        </span>
      </li>

      <li className="flex gap-3">
        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
        <span className="flex flex-wrap items-center gap-2">
          <span>
            Déjanos saber cuáles ya te viste
          </span>
          <span className="inline-flex items-center rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-white/90">
            <EyeIcon className="h-5 w-5" />
          </span>
          <span>y entre esas cuál es tu favorita por categoría.</span>
        </span>
      </li>

      <li className="flex gap-3">
        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
        <span className="flex flex-wrap items-center gap-2">
          <span>En cualquier momento puedes mirar las estadísticas</span>
          <span className="inline-flex items-center rounded-lg border border-white/15 bg-black/30 px-2 py-1">
            <StatsIcon className="translate-y-[1px]" />
          </span>
          <span>para que mires cómo van las votaciones.</span>
        </span>
      </li>

      <li className="flex gap-3">
        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
        <span>Puedes navegar por la aplicación, pero tus votos solo se grabarán cuando ingreses con tu correo.</span>
      </li>
    </ul>
  );
}
