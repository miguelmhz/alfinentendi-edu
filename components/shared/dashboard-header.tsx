import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { EnvVarWarning } from "../env-var-warning";
import Image from "next/image";
import Logo from "@/assets/imgs/logo-nobg.webp";
import Notifications from "../ui/header/notifications";
import Help from "../ui/header/Help";
import SecctionIndicator from "../ui/header/SecctionIndicator";
import { SidebarTrigger } from "../ui/sidebar/sidebar";

export const DashboardHeader = () => {
  if (!hasEnvVars) {
    return <EnvVarWarning />;
  }
  return (
    <header className="w-full flex justify-center border-b border-b-foreground/10  py-4 px-7 sticky top-0 z-50 bg-background group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      {/*Control de sidebar y logo*/}
      <div className="flex gap-6 w-[calc(331px+28px)] items-center">
        <SidebarTrigger/>
        <Link href={"/"}>
          <Image src={Logo} alt="Logo" width={130} height={62} />
        </Link>
      </div>
      <div className="w-full flex justify-between items-center p-3 px-5 text-sm">
        <div className="flex gap-5 items-center font-semibold">
          <SecctionIndicator />
        </div>
        <div className="flex gap-5 items-center">
          <Notifications />
          <Help />
        </div>
      </div>
    </header>
  );
};
