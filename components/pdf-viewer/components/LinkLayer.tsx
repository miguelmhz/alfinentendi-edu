import { useCallback, useMemo, useState } from "react";
import { PdfLinkAnnoObject, PdfActionType } from "@embedpdf/models";
import { useScroll } from '@embedpdf/plugin-scroll/react';
import { LinkConfirmationModal } from './LinkConfirmationModal';
import { useZoom } from "@embedpdf/plugin-zoom/react";

/**
 * Componente que renderiza áreas clickeables sobre los links del PDF
 */
interface LinkLayerProps {
  documentId: string;
  pageIndex: number;
  scale?: number;
  links: PdfLinkAnnoObject[];
}

export function LinkLayer({documentId, pageIndex, scale, links }: LinkLayerProps) {
  // Filtrar solo los links de la página actual
  const pageLinks = useMemo(
    () => links.filter(link => link.pageIndex === pageIndex),
    [links, pageIndex]
  );
  const { provides } = useScroll(documentId);

  const { state } = useZoom(documentId);
  const zoomPercentage = Math.round(state.currentZoomLevel * 100);

  // Estado para el modal de confirmación
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  const handleLinkClick = useCallback(
    (link: PdfLinkAnnoObject) => {
      // Comportamiento por defecto: manejar el link según su tipo
      if (!link.target) {
        console.warn('Link sin target:', link);
        return;
      }

      if (link.target.type === 'action') {
        const action = link.target.action;

        switch (action.type) {
          case PdfActionType.URI:
            // Mostrar modal de confirmación antes de abrir URL
            console.log('Solicitando confirmación para URL:', action.uri);
            setPendingUrl(action.uri);
            break;

          case PdfActionType.Goto:
            // Navegar a una página dentro del mismo PDF
            provides?.scrollToPage({ pageNumber: action.destination.pageIndex + 1 });
            console.log('Ir a página:', action.destination);
            break;

          case PdfActionType.RemoteGoto:
            // Ir a otro documento
            console.log('Ir a documento remoto:', action.destination);
            break;

          case PdfActionType.LaunchAppOrOpenFile:
            // Abrir archivo o aplicación
            console.log('Abrir archivo:', action.path);
            break;

          default:
            console.log('Acción no soportada:', action);
        }
      } else if (link.target.type === 'destination') {
        // Navegar a un destino específico
        console.log('Ir a destino:', link.target.destination);
        provides?.scrollToPage({ pageNumber: link.target.destination.pageIndex + 1 });
      }
    },
    [provides]
  );

  const handleConfirmLink = () => {
    if (pendingUrl) {
      console.log('Abriendo URL confirmada:', pendingUrl);
      window.open(pendingUrl, '_blank', 'noopener,noreferrer');
      setPendingUrl(null);
    }
  };

  const handleCancelLink = () => {
    console.log('Cancelado abrir URL');
    setPendingUrl(null);
  };

  if (!pageLinks.length) {
    return (
      <>
        <LinkConfirmationModal
          isOpen={!!pendingUrl}
          url={pendingUrl || ''}
          onConfirm={handleConfirmLink}
          onCancel={handleCancelLink}
        />
      </>
    );
  }

  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        {pageLinks.map((link, index) => {
          const rect = link.rect;
          if (!rect) return null;

          return (
            <div
              key={`${link.id}-${index}`}
              className="absolute pointer-events-auto cursor-pointer hover:bg-blue-200/5  transition-colors"
              style={{
                left: `${rect.origin.x * (zoomPercentage / 100)}px`,
                top: `${rect.origin.y * (zoomPercentage / 100)}px`,
                width: `${rect.size.width * (zoomPercentage / 100)}px`,
                height: `${rect.size.height * (zoomPercentage / 100)}px`,
                // Borde azul semi-transparente para visualizar el área del link
                border: '1px solid rgba(59, 130, 246, 0.05)',
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLinkClick(link);
              }}
              title={getLinkTitle(link)}
            />
          );
        })}
      </div>
      
      {/* Modal de confirmación */}
      <LinkConfirmationModal
        isOpen={!!pendingUrl}
        url={pendingUrl || ''}
        onConfirm={handleConfirmLink}
        onCancel={handleCancelLink}
      />
    </>
  );
}

/**
 * Función auxiliar para obtener un título descriptivo del link
 */
function getLinkTitle(link: PdfLinkAnnoObject): string {
  if (!link.target) return 'Link';

  if (link.target.type === 'action') {
    const action = link.target.action;
    switch (action.type) {
      case PdfActionType.URI:
        return `Abrir: ${action.uri}`;
      case PdfActionType.Goto:
        return `Ir a página ${action.destination.pageIndex + 1}`;
      case PdfActionType.RemoteGoto:
        return 'Ir a documento externo';
      case PdfActionType.LaunchAppOrOpenFile:
        return `Abrir: ${action.path}`;
      default:
        return 'Link';
    }
  } else if (link.target.type === 'destination') {
    return `Ir a página ${link.target.destination.pageIndex + 1}`;
  }

  return 'Link';
}