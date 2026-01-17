import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user: authUser }, error } = await supabase.auth.getUser();

  if (error || !authUser) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: authUser.email! },
    select: { id: true },
  });

  if (!user) {
    redirect("/auth/login");
  }

  redirect(`/usuarios/${user.id}`);
}
