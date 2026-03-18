"use client";

import { UpdatePasswordForm } from "@/components/update-password-form";
import Image from "next/image";
import individualImg from "@/assets/imgs/individual.webp";
import logo from "@/assets/imgs/logo-nobg.webp";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center">
      <div className="flex-1 overflow-hidden hidden md:block">
        <div className="w-full h-full relative">
          <Image
            src={individualImg}
            alt="Nueva contraseña"
            width={1000}
            height={1000}
            className="w-full h-svh object-cover object-top"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          <Image
            className="absolute w-24 top-4 left-4 z-50 invert"
            src={logo}
            alt="Logo"
            width={200}
            height={200}
          />
          <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-4 p-4 lg:p-8 z-10">
            <h2 className="text-4xl font-bold text-white">Nueva contraseña</h2>
            <p className="text-white text-lg">
              Elige una contraseña segura para proteger tu cuenta.
            </p>
          </div>
        </div>
      </div>
      <div className="mx-auto flex-1 md:px-28 md:py-auto">
        <div className="w-[410px] mx-auto">
          <UpdatePasswordForm />
        </div>
      </div>
    </div>
  );
}
