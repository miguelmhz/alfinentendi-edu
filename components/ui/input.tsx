import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    return (
      <div className="relative">
      <input
        type={showPassword ? "text" : type}
        className={cn(
          "flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-[10px] text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary  focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
      {type === "password" && showPassword ? (
        <EyeOff className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" onClick={() => {setShowPassword(!showPassword)   }} />
      ) : type === "password" && !showPassword ? (
        <Eye className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" onClick={() => {setShowPassword(!showPassword)   }} />
      ) : null}
      </div>
      );
  },
);
Input.displayName = "Input";

export { Input };
