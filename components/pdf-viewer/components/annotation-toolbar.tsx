"use client";

import { useAnnotation } from "@embedpdf/plugin-annotation/react";
import { Button } from "@/components/ui/button";
import {
  Highlighter,
  Underline,
  Pen,
  Square,
  Circle,
  ArrowRight,
  Minus,
  Type,
  Trash2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AnnotationToolbarProps {
  documentId: string;
}

export function AnnotationToolbar({ documentId }: AnnotationToolbarProps) {
  const { provides: annotationApi, state } = useAnnotation(documentId);

  if (!annotationApi) return null;

  const activeToolId = state.activeToolId;
  const hasSelection = !!state.selectedUid;

  const handleToolClick = (toolId: string) => {
    if (activeToolId === toolId) {
      // Deactivate if clicking the same tool
      annotationApi.setActiveTool(null);
    } else {
      annotationApi.setActiveTool(toolId);
    }
  };

  const handleDelete = () => {
    const selection = annotationApi.getSelectedAnnotation();
    if (selection) {
      annotationApi.deleteAnnotation(
        selection.object.pageIndex,
        selection.object.id
      );
    }
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 rounded-lg border bg-background p-2">
        {/* Text Markup Tools */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeToolId === "highlight" ? "default" : "ghost"}
              size="icon"
              onClick={() => handleToolClick("highlight")}
              className="h-8 w-8"
            >
              <Highlighter className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Resaltar texto</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeToolId === "underline" ? "default" : "ghost"}
              size="icon"
              onClick={() => handleToolClick("underline")}
              className="h-8 w-8"
            >
              <Underline className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Subrayar texto</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Drawing Tools */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeToolId === "ink" ? "default" : "ghost"}
              size="icon"
              onClick={() => handleToolClick("ink")}
              className="h-8 w-8"
            >
              <Pen className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Dibujo libre</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeToolId === "inkHighlighter" ? "default" : "ghost"}
              size="icon"
              onClick={() => handleToolClick("inkHighlighter")}
              className="h-8 w-8"
            >
              <Highlighter className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Resaltador libre</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Shape Tools */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeToolId === "square" ? "default" : "ghost"}
              size="icon"
              onClick={() => handleToolClick("square")}
              className="h-8 w-8"
            >
              <Square className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Rectángulo</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeToolId === "circle" ? "default" : "ghost"}
              size="icon"
              onClick={() => handleToolClick("circle")}
              className="h-8 w-8"
            >
              <Circle className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Círculo</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeToolId === "line" ? "default" : "ghost"}
              size="icon"
              onClick={() => handleToolClick("line")}
              className="h-8 w-8"
            >
              <Minus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Línea</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeToolId === "lineArrow" ? "default" : "ghost"}
              size="icon"
              onClick={() => handleToolClick("lineArrow")}
              className="h-8 w-8"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Flecha</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Text Tool */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeToolId === "freeText" ? "default" : "ghost"}
              size="icon"
              onClick={() => handleToolClick("freeText")}
              className="h-8 w-8"
            >
              <Type className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Cuadro de texto</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Delete Tool */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={!hasSelection}
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Eliminar anotación</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
