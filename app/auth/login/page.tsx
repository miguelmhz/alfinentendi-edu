"use client";

import { LoginPassword } from "@/components/login-password";
import { LoginMagicLink } from "@/components/login-magicLink";
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import Image from "next/image";
import individualImg from "@/assets/imgs/individual.webp";
import escuelaImg from "@/assets/imgs/escuela.webp";
import logo from "@/assets/imgs/logo-nobg.webp";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Beneficios from "@/components/auth/beneficios";

export default function Page() {
  const [activeTab, setActiveTab] = useState<"individual" | "escuela">(
    "individual"
  );

  useEffect(() => {
    // Capturar errores del hash URL
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const error = params.get("error");
      const errorCode = params.get("error_code");
      const errorDescription = params.get("error_description");

      if (error) {
        let errorMessage = "Error al iniciar sesión";

        // Mensajes personalizados según el código de error
        if (errorCode === "otp_expired") {
          errorMessage = "El enlace de verificación ha expirado. Por favor, solicita uno nuevo.";
        } else if (errorDescription) {
          errorMessage = decodeURIComponent(errorDescription.replace(/\+/g, " "));
        }

        toast.error(errorMessage);

        // Limpiar el hash de la URL
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  }, []);

  return (
    <div className="flex min-h-svh w-full items-center justify-center">
      <div className="flex-1 overflow-hidden hidden md:block">
        <div className="w-full h-full relative">
          <Image
            src={activeTab === "individual" ? individualImg : escuelaImg}
            alt={activeTab === "individual" ? "Individual" : "Escuela"}
            width={1000}
            height={1000}
            className="w-full h-svh object-cover object-top"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          <Image className="absolute w-24  top-4 left-4 z-50 invert" src={logo} alt="Logo" width={200} height={200} />
          <Beneficios activeTab={activeTab} />
        </div>
      </div>
      <div className="mx-auto flex-1 md:px-28 md:py-auto">
        <Tabs
          value={activeTab}
          onValueChange={(value: string) =>
            setActiveTab(value as "individual" | "escuela")
          }
          className="w-[410px] mx-auto"
        >
          <TabsList>
            <TabsTrigger value="individual">Acceso Individual</TabsTrigger>
            <TabsTrigger value="escuela">Acceso Escuela</TabsTrigger>
          </TabsList>
          <TabsContents className="w-[410px]">
            <TabsContent value="individual" className="h-auto">
              <LoginPassword />
            </TabsContent>
            <TabsContent value="escuela" className="h-auto">
              <LoginMagicLink />
            </TabsContent>
          </TabsContents>
        </Tabs>
      </div>
    </div>
  );
}
