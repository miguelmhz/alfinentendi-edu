"use client";

import { ForgotPasswordForm } from "@/components/forgot-password-form";
import Image from "next/image";
import individualImg from "@/assets/imgs/individual.webp";
import logo from "@/assets/imgs/afe.webp";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full flex-col md:flex-row md:items-center">
      {/* ── Desktop hero ── */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <div className="w-full h-full relative">
          <Image
            src={individualImg}
            alt="Recuperar contraseña"
            width={1000}
            height={1000}
            className="w-full h-svh object-cover object-top"
          />
          <div className="absolute inset-0 bg-black/50" />
          <Image
            className="absolute w-24 top-4 left-4 z-50 invert"
            src={logo}
            alt="Logo"
            width={200}
            height={200}
          />
          <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-4 p-4 lg:p-8 z-10">
            <h2 className="text-4xl font-bold text-white">Recupera tu acceso</h2>
            <p className="text-white text-lg">
              Te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </div>
        </div>
      </div>

      {/* ── Mobile hero ── */}
      <div className="md:hidden relative overflow-hidden bg-gradient-to-br from-[#0C1B33] via-[#0F2347] to-[#1B3A6B]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-12 h-56 w-56 rounded-full bg-blue-400/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center px-6 pt-14 pb-12 gap-3">
          <Image
            src={logo}
            alt="Al Fin Entendí"
            width={64}
            height={64}
            className="invert drop-shadow-[0_0_12px_rgba(59,130,246,0.4)]"
          />
          <div>
            <h1 className="text-[1.6rem] font-bold text-white tracking-tight leading-tight">
              Recupera tu acceso
            </h1>
            <p className="text-sm text-blue-200/90 mt-2 max-w-[260px] mx-auto leading-relaxed">
              Te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </div>
        </div>
      </div>

      {/* ── Formulario ── */}
      <div
        className="
          relative z-10 flex-1
          bg-background rounded-t-[2rem] -mt-6 shadow-[0_-8px_40px_rgba(0,0,0,0.14)]
          px-5 pt-8 pb-12
          md:bg-transparent md:rounded-none md:mt-0 md:shadow-none
          md:flex-1 md:px-28 md:py-0
        "
      >
        <div className="w-full max-w-[410px] mx-auto">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
