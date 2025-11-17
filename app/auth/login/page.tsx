import { LoginForm } from "@/components/login-form";
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
      <div className="w-full flex-1 md:px-28 md:py-14">
        <Tabs defaultValue="profesor">
          <TabsList>
            <TabsTrigger value="profesor">Soy Profesor</TabsTrigger>
            <TabsTrigger value="alumno">Soy Alumno</TabsTrigger>
          </TabsList>
          <TabsContents>
            <TabsContent value="profesor">
              <LoginForm />
            </TabsContent>
            <TabsContent value="alumno">
              Change your password here.
            </TabsContent>
          </TabsContents>
        </Tabs>
        
      </div>
    </div>
  );
}
