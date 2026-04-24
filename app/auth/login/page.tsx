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
import {
  BookOpen,
  GraduationCap,
  Library,
  MessageSquare,
  Users,
  BookMarked,
} from "lucide-react";

const MOBILE_BENEFITS = {
  individual: [
    { icon: BookOpen, label: "Libros digitales" },
    { icon: GraduationCap, label: "Recursos educativos" },
    { icon: Library, label: "Biblioteca digital" },
    { icon: MessageSquare, label: "Foro estudiantil" },
  ],
  escuela: [
    { icon: BookOpen, label: "Libros digitales" },
    { icon: Users, label: "Licencias escolares" },
    { icon: BookMarked, label: "Guías docentes" },
    { icon: MessageSquare, label: "Foro interactivo" },
  ],
};

export default function Page() {
  const [activeTab, setActiveTab] = useState<"individual" | "escuela">(
    "individual"
  );

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const error = params.get("error");
      const errorCode = params.get("error_code");
      const errorDescription = params.get("error_description");

      if (error) {
        let errorMessage = "Error al iniciar sesión";
        if (errorCode === "otp_expired") {
          errorMessage =
            "El enlace de verificación ha expirado. Por favor, solicita uno nuevo.";
        } else if (errorDescription) {
          errorMessage = decodeURIComponent(
            errorDescription.replace(/\+/g, " ")
          );
        }
        toast.error(errorMessage);
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  }, []);

  const currentBenefits = MOBILE_BENEFITS[activeTab];

  return (
    <div className="flex min-h-svh w-full flex-col md:flex-row md:items-center">
      {/* ── Desktop hero (sin cambios) ── */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <div className="w-full h-full relative">
          <Image
            src={activeTab === "individual" ? individualImg : escuelaImg}
            alt={activeTab === "individual" ? "Individual" : "Escuela"}
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
          <Beneficios activeTab={activeTab} />
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

        <div className="relative z-10 flex flex-col items-center text-center px-6 pt-14 pb-12 gap-4">
          <Image
            src={logo}
            alt="Al Fin Entendí"
            width={68}
            height={68}
            className="invert drop-shadow-[0_0_12px_rgba(59,130,246,0.4)]"
          />
          <div>
            <h1 className="text-[1.6rem] font-bold text-white tracking-tight leading-tight">
              Al Fin Entendí
            </h1>
            <p className="text-sm text-blue-200/90 mt-1 font-medium">
              Tu biblioteca digital educativa
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-1">
            {currentBenefits.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white backdrop-blur-sm"
              >
                <Icon className="h-3 w-3 text-blue-300 flex-shrink-0" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Área del formulario ── */}
      <div
        className="
          relative z-10 flex-1
          bg-background rounded-t-[2rem] -mt-6 shadow-[0_-8px_40px_rgba(0,0,0,0.14)]
          px-5 pt-8 pb-12
          md:bg-transparent md:rounded-none md:mt-0 md:shadow-none
          md:flex-1 md:px-28 md:py-0
        "
      >
        <Tabs
          value={activeTab}
          onValueChange={(value: string) =>
            setActiveTab(value as "individual" | "escuela")
          }
          className="w-full max-w-[410px] mx-auto"
        >
          <TabsList>
            <TabsTrigger value="individual">Acceso Individual</TabsTrigger>
            <TabsTrigger value="escuela">Acceso Escuela</TabsTrigger>
          </TabsList>
          <TabsContents className="w-full max-w-[410px]">
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
