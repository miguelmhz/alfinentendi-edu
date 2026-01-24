import { Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AnnotationToggleButton() {
  const [isActive, setIsActive] = useState(true);

  const handleClick = () => {
    // Toggle visibility using CSS class
    const annotationLayers = document.querySelectorAll('[data-annotation-layer]');
    annotationLayers.forEach((layer) => {
      const element = layer as HTMLElement;
      const isHidden = element.style.display === 'none';
      element.style.display = isHidden ? '' : 'none';
    });
    
    setIsActive(!isActive);
  };

  // Check initial state
  useEffect(() => {
    const annotationLayers = document.querySelectorAll('[data-annotation-layer]');
    if (annotationLayers.length > 0) {
      const firstLayer = annotationLayers[0] as HTMLElement;
      setIsActive(!firstLayer.style.display || firstLayer.style.display !== 'none');
    }
  }, []);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? "default" : "ghost"}
            size="icon"
            onClick={handleClick}
            className="h-9 w-9"
          >
            {isActive ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isActive ? 'Ocultar anotaciones' : 'Mostrar anotaciones'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
