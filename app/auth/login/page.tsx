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
import profesorImg from "@/assets/imgs/profesor.webp";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center">
      <div className="flex-1 overflow-hidden hidden md:block">
        <div className="w-full h-full relative">
          <Image
            src={profesorImg}
            alt="Profesor"
            width={1000}
            height={1000}
            className="w-full h-svh object-cover object-top"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>
      </div>
      <div className="mx-auto flex-1 md:px-28 md:py-14">
        <Tabs defaultValue="profesor" className="w-[410px] mx-auto">
          <TabsList>
            <TabsTrigger value="profesor">Soy Profesor</TabsTrigger>
            <TabsTrigger value="alumno">Soy Alumno</TabsTrigger>
          </TabsList>
          <TabsContents className="w-[410px]">
            <TabsContent value="profesor" className="h-[410px]">
              <LoginPassword />
            </TabsContent>
            <TabsContent value="alumno" className="h-[410px]">
              <LoginMagicLink />
            </TabsContent>
          </TabsContents>
        </Tabs>
        
      </div>
    </div>
  );
}
