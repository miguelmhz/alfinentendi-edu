"use client";

import { useState, useEffect, useCallback } from "react";
import { useAnnotation } from "@embedpdf/plugin-annotation/react";
import { PdfBlendMode } from "@embedpdf/models";
import { Check } from "lucide-react";

interface AnnotationPropertiesSidebarProps {
  documentId: string;
}

// Paleta de colores predefinida
const COLOR_PRESETS = [
  "#FFEB3B", // Amarillo (highlight)
  "#FFC107", // Amarillo oscuro
  "#FF9800", // Naranja
  "#FF5722", // Naranja rojizo
  "#F44336", // Rojo
  "#E91E63", // Rosa
  "#9C27B0", // Púrpura
  "#673AB7", // Púrpura oscuro
  "#3F51B5", // Índigo
  "#2196F3", // Azul (underline)
  "#03A9F4", // Azul claro
  "#00BCD4", // Cian
  "#009688", // Verde azulado
  "#4CAF50", // Verde
  "#8BC34A", // Verde claro
  "#CDDC39", // Lima
  "#9E9E9E", // Gris
  "#000000", // Negro (freeText)
];

const BLEND_MODE_OPTIONS = [
  { value: PdfBlendMode.Normal, label: "Normal" },
  { value: PdfBlendMode.Multiply, label: "Multiplicar" },
  { value: PdfBlendMode.Screen, label: "Pantalla" },
  { value: PdfBlendMode.Overlay, label: "Superponer" },
  { value: PdfBlendMode.Darken, label: "Oscurecer" },
  { value: PdfBlendMode.Lighten, label: "Aclarar" },
];

interface ColorSwatchProps {
  color: string;
  active: boolean;
  onSelect: (color: string) => void;
}

const ColorSwatch = ({ color, active, onSelect }: ColorSwatchProps) => {
  return (
    <button
      onClick={() => onSelect(color)}
      className={`
        h-8 w-8 rounded-md border-2 transition-all relative
        ${active ? "border-blue-500 scale-110" : "border-gray-300 hover:border-gray-400"}
      `}
      style={{ backgroundColor: color }}
      title={color}
    >
      {active && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Check size={16} className="text-white drop-shadow-md" strokeWidth={3} />
        </div>
      )}
    </button>
  );
};

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

const Slider = ({ value, min, max, step, onChange }: SliderProps) => {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-500"
    />
  );
};

// Hook para debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export const AnnotationPropertiesSidebar = ({
  documentId,
}: AnnotationPropertiesSidebarProps) => {
  const { provides: annotation, state } = useAnnotation(documentId);

  // Obtener la herramienta activa y la anotación seleccionada
  const activeTool = state.activeToolId;
  const tool = activeTool ? annotation?.getActiveTool() : null;
  const selected = annotation?.getSelectedAnnotation();
  const editing = !!selected;

  // Valores base según si estamos editando o configurando defaults
  const selectedObj = selected?.object as any;

  const baseColor =
    editing && (selectedObj as any)?.color
      ? (selectedObj as any).color
      : ((tool?.defaults as any)?.color ?? "#FFEB3B");

  const baseOpacity =
    editing && (selectedObj as any)?.opacity !== undefined
      ? (selectedObj as any).opacity
      : ((tool?.defaults as any)?.opacity ?? 1);

  const baseBlend =
    editing && (selectedObj as any)?.blendMode !== undefined
      ? (selectedObj as any).blendMode
      : ((tool?.defaults as any)?.blendMode ?? PdfBlendMode.Normal);

  // Grosor de línea (solo para ink)
  const baseStroke =
    editing && (selectedObj as any)?.strokeWidth !== undefined
      ? (selectedObj as any).strokeWidth
      : ((tool?.defaults as any)?.strokeWidth ?? 2);

  // Estados locales
  const [color, setColor] = useState(baseColor);
  const [opacity, setOpacity] = useState(baseOpacity);
  const [blend, setBlend] = useState(baseBlend);
  const [stroke, setStroke] = useState(baseStroke);

  // Sincronizar con valores base cuando cambien
  useEffect(() => setColor(baseColor), [baseColor]);
  useEffect(() => setOpacity(baseOpacity), [baseOpacity]);
  useEffect(() => setBlend(baseBlend), [baseBlend]);
  useEffect(() => setStroke(baseStroke), [baseStroke]);

  // Debounce para opacity y stroke
  const debouncedOpacity = useDebounce(opacity, 300);
  const debouncedStroke = useDebounce(stroke, 300);

  useEffect(() => {
    if (debouncedOpacity !== baseOpacity) {
      applyPatch({ opacity: debouncedOpacity });
    }
  }, [debouncedOpacity]);

  useEffect(() => {
    if (debouncedStroke !== baseStroke) {
      applyPatch({ strokeWidth: debouncedStroke });
    }
  }, [debouncedStroke]);

  const applyPatch = useCallback(
    (patch: Record<string, any>) => {
      if (!annotation) return;

      if (editing && selected) {
        // Actualizar anotación existente
        annotation.updateAnnotation(
          selected.object.pageIndex,
          selected.object.id,
          patch as any
        );
      } else if (activeTool && tool) {
        // Actualizar defaults de la herramienta activa
        const currentDefaults = tool.defaults || {};
        const newDefaults = { ...currentDefaults, ...patch };
        // Note: setToolDefaults might not be available in all versions
        // The tool defaults are typically set during tool creation
        console.log('Tool defaults update:', activeTool, newDefaults);
      }
    },
    [annotation, editing, selected, activeTool, tool]
  );

  const changeColor = (c: string) => {
    setColor(c);
    applyPatch({ color: c });
  };

  const changeBlend = (val: number) => {
    const bm = val as PdfBlendMode;
    setBlend(bm);
    applyPatch({ blendMode: bm });
  };

  if (!annotation) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        Cargando...
      </div>
    );
  }

  // Show properties if either editing an annotation OR configuring a tool
  if (!editing && !activeTool) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        Selecciona una anotación o activa una herramienta para configurar sus propiedades
      </div>
    );
  }

  const toolNames: Record<string, string> = {
    highlight: "Resaltado",
    underline: "Subrayado",
    strikeout: "Tachado",
    freeText: "Cuadro de texto",
    ink: "Dibujo libre",
    inkHighlighter: "Resaltador libre",
    square: "Rectángulo",
    circle: "Círculo",
    line: "Línea",
    lineArrow: "Flecha",
    Highlight: "Resaltado",
    Underline: "Subrayado",
    StrikeOut: "Tachado",
    FreeText: "Cuadro de texto",
    Ink: "Dibujo libre",
    Square: "Rectángulo",
    Circle: "Círculo",
    Line: "Línea",
  };

  // Get the display name - use annotation type if editing, tool name if configuring
  const displayName = editing && selectedObj?.type
    ? toolNames[selectedObj.type] || selectedObj.type
    : activeTool
    ? toolNames[activeTool] || activeTool
    : "Anotación";

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="border-b border-gray-200 pb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          {editing ? "Editar anotación" : "Configurar herramienta"}
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          {displayName}
        </p>
      </div>

      {/* Color */}
      <section>
        <label className="mb-3 block text-sm font-medium text-gray-900">
          Color
        </label>
        <div className="grid grid-cols-6 gap-2">
          {COLOR_PRESETS.map((c) => (
            <ColorSwatch
              key={c}
              color={c}
              active={c === color}
              onSelect={changeColor}
            />
          ))}
        </div>
      </section>

      {/* Opacity */}
      <section>
        <label className="mb-2 block text-sm font-medium text-gray-900">
          Opacidad
        </label>
        <Slider
          value={opacity}
          min={0.1}
          max={1}
          step={0.05}
          onChange={setOpacity}
        />
        <span className="mt-1 block text-xs text-gray-500">
          {Math.round(opacity * 100)}%
        </span>
      </section>

      {/* Stroke Width - solo para ink */}
      {(activeTool === "ink" || activeTool === "inkHighlighter") && (
        <section>
          <label className="mb-2 block text-sm font-medium text-gray-900">
            Grosor de línea
          </label>
          <Slider
            value={stroke}
            min={1}
            max={30}
            step={1}
            onChange={setStroke}
          />
          <span className="mt-1 block text-xs text-gray-500">{stroke}px</span>
        </section>
      )}

      {/* Blend Mode */}
      <section>
        <label className="mb-2 block text-sm font-medium text-gray-900">
          Modo de mezcla
        </label>
        <select
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={blend}
          onChange={(e) => changeBlend(parseInt(e.target.value, 10))}
        >
          {BLEND_MODE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </section>

      {/* Info adicional si estamos editando */}
      {editing && (
        <div className="border-t border-gray-200 pt-3">
          <p className="text-xs text-gray-500">
            Los cambios se aplican inmediatamente a la anotación seleccionada
          </p>
        </div>
      )}
    </div>
  );
};
