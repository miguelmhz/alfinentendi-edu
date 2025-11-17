import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { EnvVarWarning } from "../env-var-warning";
import { AuthButton } from "../auth-button";
import { Menu } from "lucide-react";
import Image from "next/image";
import Logo from "@/assets/imgs/logo-nobg.webp";
import Notifications from "../ui/header/notifications";
import Help from "../ui/header/Help";
import SecctionIndicator from "../ui/header/SecctionIndicator";

export const DashboardHeader = () => {
    if(!hasEnvVars){
        return <EnvVarWarning />
    }
    return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10  py-4 px-7">
      {/*Control de sidebar y logo*/}
      <div className="flex gap-6 w-[calc(331px-28px)]">
        <button>
            <Menu />
        </button>
        <Link href={"/"}>
            <Image src={Logo} alt="Logo" width={130} height={62}/>
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
    </nav>
  );
};
