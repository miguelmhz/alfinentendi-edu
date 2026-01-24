"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EmbedPDF } from "@embedpdf/core/react";
import { usePdfiumEngine } from "@embedpdf/engines/react";
import { createPluginRegistration } from "@embedpdf/core";
import {
  ViewportPluginPackage,
  Viewport,
} from "@embedpdf/plugin-viewport/react";
import {
  ScrollPluginPackage,
  ScrollStrategy,
  Scroller,
} from "@embedpdf/plugin-scroll/react";
import {
  DocumentManagerPluginPackage,
  DocumentContent,
} from "@embedpdf/plugin-document-manager/react";
import {
  InteractionManagerPluginPackage,
  GlobalPointerProvider,
  PagePointerProvider,
} from "@embedpdf/plugin-interaction-manager/react";
import {
  ZoomMode,
  ZoomPluginPackage,
  MarqueeZoom,
  ZoomGestureWrapper,
} from "@embedpdf/plugin-zoom/react";
import { PanPluginPackage } from "@embedpdf/plugin-pan/react";
import { SpreadMode, SpreadPluginPackage } from "@embedpdf/plugin-spread/react";
import { Rotate, RotatePluginPackage } from "@embedpdf/plugin-rotate/react";
import {
  RenderLayer,
  RenderPluginPackage,
} from "@embedpdf/plugin-render/react";
import {
  TilingLayer,
  TilingPluginPackage,
} from "@embedpdf/plugin-tiling/react";
import {
  RedactionLayer,
  RedactionPluginPackage,
} from "@embedpdf/plugin-redaction/react";
import { ExportPluginPackage } from "@embedpdf/plugin-export/react";
import { PrintPluginPackage } from "@embedpdf/plugin-print/react";
import {
  SelectionLayer,
  SelectionPluginPackage,
} from "@embedpdf/plugin-selection/react";
import {
  SearchLayer,
  SearchPluginPackage,
} from "@embedpdf/plugin-search/react";
import { ThumbnailPluginPackage } from "@embedpdf/plugin-thumbnail/react";
import {
  MarqueeCapture,
  CapturePluginPackage,
} from "@embedpdf/plugin-capture/react";
import { FullscreenPluginPackage } from "@embedpdf/plugin-fullscreen/react";
import { HistoryPluginPackage } from "@embedpdf/plugin-history/react";
import {
  AnnotationPluginPackage,
  AnnotationLayer,
} from "@embedpdf/plugin-annotation/react";
import { CommandsPluginPackage } from "@embedpdf/plugin-commands/react";
import { I18nPluginPackage } from "@embedpdf/plugin-i18n/react";
import {
  UIPluginPackage,
  UIProvider,
  UIRenderers,
  useSchemaRenderer,
  useSelectionMenu,
} from "@embedpdf/plugin-ui/react";
import { LoadingSpinner } from "./components/loading-spinner";
import { DocumentPasswordPrompt } from "./components/document-password-prompt";
import { PageControls } from "./components/page-controls";
import {
  ConsoleLogger,
  PdfAnnotationSubtype,
  PdfLinkAnnoObject,
} from "@embedpdf/models";
import { EmptyState } from "./components/empty-state";
import { commands } from "./config/commands";
import { viewerUISchema } from "./config/ui-schema";
import { SchemaToolbar } from "./ui/schema-toolbar";
import { SchemaPanel } from "./ui/schema-panel";
import { SchemaMenu } from "./ui/schema-menu";
import { CustomZoomToolbar } from "./components/custom-zoom-toolbar";
import { ThumbnailsSidebar } from "./components/thumbnails-sidebar";
import { SearchSidebar } from "./components/search-sidebar";
import { OutlineSidebar } from "./components/outline-sidebar";
import { CommentSidebarWrapper, BookIdContext } from "./components/comment-sidebar-wrapper";
import { AnnotationPropertiesSidebar } from "./components/annotation-properties-sidebar";
import { AnnotationToggleButton } from "./components/AnnotationToggleButton";
import { SchemaSelectionMenu } from "./ui/schema-selection-menu";
import { LinkLayer } from "./components/LinkLayer";
import { englishLocale, spanishLocale } from "./config/locale";
import { useAnnotationPersistence } from "./hooks/useAnnotationPersistence";
import { useReadingLog } from "./hooks/useReadingLog";
import { useBookProgress } from "./hooks/useBookProgress";
import "./styles/toolbar-animations.css";

const logger = new ConsoleLogger();

interface ViewerSchemaPageProps {
  pdfUrl?: string;
  bookTitle?: string;
  userName?: string;
  bookId?: string;
  bookSanityId?: string;
  userId?: string;
}

/**
 * Schema-Driven Viewer Page
 *
 * This viewer demonstrates the power of the UI plugin and schema-driven architecture.
 * Instead of hardcoding the toolbar components, the UI is defined declaratively
 * in the UI schema and rendered dynamically.
 *
 * Benefits:
 * - Declarative UI configuration
 * - Type-safe schema
 * - Easily customizable and extensible
 * - Consistent UI patterns
 * - Separation of concerns
 */
export function ViewerSchemaPage({
  pdfUrl,
  bookTitle,
  userName = "Usuario",
  bookId,
  bookSanityId,
  userId,
}: ViewerSchemaPageProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { engine, isLoading, error } = usePdfiumEngine({
    logger,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [links, setLinks] = useState<PdfLinkAnnoObject[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Hook para trackear lectura del libro
  const { setCurrentPage: updateCurrentPage, setPagesViewed } = useReadingLog({
    bookSanityId: bookSanityId || "",
    enabled: !!bookSanityId,
  });

  // Hook para progreso de lectura (offline-first)
  const { lastPage, updateProgress, isLoading: isLoadingProgress } = useBookProgress({
    bookSanityId: bookSanityId || "",
    userId,
    enabled: !!bookSanityId && !!userId,
  });


  // We don't need to track document ID separately
  // The annotation plugin will handle documents internally

  const documentUrl =
    pdfUrl ||
    "https://raw.githubusercontent.com/miguelmhz/public-files/6e67b8f1c5b39353820520cdf3669894529a19d3/muestra_enalces.pdf";

  const getLinks = async () => {
    if (!engine) return;

    try {
      // Obtener el documento ya cargado por el LoaderPlugin
      const document = await engine
        .openDocumentUrl({
          id: `${documentUrl}`, // Mismo ID que en LoaderPluginPackage
          url: documentUrl,
        })
        .toPromise();

      if (!document) {
        console.warn("No se pudo obtener el documento");
        return;
      }
      console.log("Document loaded:", {document});

      // Guardar el total de páginas
      setTotalPages(document.pageCount);
      
      // Actualizar páginas vistas para el log
      setPagesViewed(document.pageCount);

      // Obtener links de TODAS las páginas
      const allLinks: PdfLinkAnnoObject[] = [];

      for (const page of document.pages) {
        const annotations = await engine
          .getPageAnnotations(document, page)
          .toPromise();

        // Filtrar solo las anotaciones de tipo LINK
        const linkAnnotations = annotations.filter(
          (anno): anno is PdfLinkAnnoObject =>
            anno.type === PdfAnnotationSubtype.LINK
        );

        allLinks.push(...linkAnnotations);
      }

      setLinks(allLinks);
    } catch (error) {
      console.error("❌ Error al obtener links:", error);
      setLinks([]);
    }
  };

  useEffect(() => {
    if (!engine) return;
    getLinks();
  }, [engine]);

  // Actualizar progreso cuando cambia la página (solo para reading log)
  useEffect(() => {
    if (!allowProgressUpdatesRef.current) {
      return;
    }

    if (currentPage > 0 && totalPages > 0) {
      // Actualizar reading log
      updateCurrentPage(currentPage);
      
      // Actualizar progreso (offline-first)
      updateProgress(currentPage, totalPages);
    }
  }, [currentPage, totalPages, updateCurrentPage, updateProgress]);

  // Ref para guardar el registry y scroll plugin
  const scrollPluginRef = useRef<any>(null);
  const hasNavigatedRef = useRef(false);
  const allowProgressUpdatesRef = useRef(false);
  const [scrollReady, setScrollReady] = useState(false);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  // Callback cuando el visor está listo
  const handleInitialized = useCallback(async (registry: any) => {
    const scroll = registry.getPlugin('scroll')?.provides();
    
    if (!scroll) return;

    // Guardar referencia al scroll plugin
    scrollPluginRef.current = scroll;
    setScrollReady(true);

    // 1. Escuchar cambios de página en tiempo real
    scroll.onPageChange((event: any) => {
      const { pageNumber, totalPages: total } = event;
      
      // Actualizar estado local
      setCurrentPage(pageNumber);
      setTotalPages(total);
      
      console.log(`📄 Page changed: ${pageNumber} of ${total}`);
    });
  }, []);

  // 2. Navegar a última página cuando lastPage esté disponible
  useEffect(() => {
    if (!scrollPluginRef.current || !scrollReady) {
      return;
    }

    if (hasNavigatedRef.current || lastPage <= 1 || isLoadingProgress) {
      return;
    }

    // Esperar un momento para que el layout esté completamente listo
    const timer = setTimeout(() => {
      scrollPluginRef.current?.scrollToPage({ 
        pageNumber: lastPage, 
        behavior: 'instant' 
      });
      hasNavigatedRef.current = true;
      allowProgressUpdatesRef.current = true;
      console.log(`🎯 Navigated to saved page: ${lastPage}`);
      
      // Marcar carga inicial como completa después de navegar
      setTimeout(() => {
        setIsInitialLoadComplete(true);
      }, 300);
    }, 500);

    return () => clearTimeout(timer);
  }, [lastPage, isLoadingProgress, scrollReady]);

  // Si no hay página guardada, habilitar actualizaciones en cuanto cargue
  useEffect(() => {
    if (!isLoadingProgress && lastPage <= 1 && scrollReady) {
      allowProgressUpdatesRef.current = true;
      // Marcar carga inicial como completa si no hay navegación pendiente
      setTimeout(() => {
        setIsInitialLoadComplete(true);
      }, 800);
    }
  }, [isLoadingProgress, lastPage, scrollReady]);



  

  // Memoize UIProvider props to prevent unnecessary remounts
  const uiComponents = useMemo(
    () => ({
      "zoom-toolbar": CustomZoomToolbar,
      "thumbnails-sidebar": ThumbnailsSidebar,
      "search-sidebar": SearchSidebar,
      "outline-sidebar": OutlineSidebar,
      "comment-sidebar": CommentSidebarWrapper,
      "annotation-properties-sidebar": AnnotationPropertiesSidebar,
      "annotation-toggle-button": AnnotationToggleButton,
    }),
    []
  );

  const uiRenderers: UIRenderers = useMemo(
    () => ({
      toolbar: SchemaToolbar,
      sidebar: SchemaPanel,
      menu: SchemaMenu,
      selectionMenu: SchemaSelectionMenu,
    }),
    []
  );

  const plugins = useMemo(
    () => [
      createPluginRegistration(DocumentManagerPluginPackage, {
        initialDocuments: [{ url: documentUrl }],
      }),
      createPluginRegistration(ViewportPluginPackage, {
        viewportGap: 10,
      }),
      createPluginRegistration(ScrollPluginPackage, {
        defaultStrategy: ScrollStrategy.Vertical,
      }),
      createPluginRegistration(I18nPluginPackage, {
    defaultLocale: 'es',
    locales: [englishLocale, spanishLocale],
    // Optional: Specify a fallback locale if translation is missing
    fallbackLocale: 'es',
  }),
      createPluginRegistration(InteractionManagerPluginPackage),
      createPluginRegistration(ZoomPluginPackage, {
        defaultZoomLevel: ZoomMode.FitPage,
      }),
      createPluginRegistration(PanPluginPackage),
      createPluginRegistration(SpreadPluginPackage, {
        defaultSpreadMode: SpreadMode.None,
      }),
      createPluginRegistration(RotatePluginPackage),
      createPluginRegistration(ExportPluginPackage),
      createPluginRegistration(PrintPluginPackage),
      createPluginRegistration(RenderPluginPackage),
      createPluginRegistration(TilingPluginPackage, {
        tileSize: 768,
        overlapPx: 2.5,
        extraRings: 0,
      }),
      createPluginRegistration(SelectionPluginPackage),
      createPluginRegistration(SearchPluginPackage),
      createPluginRegistration(RedactionPluginPackage),
      createPluginRegistration(CapturePluginPackage),
      createPluginRegistration(HistoryPluginPackage),
      createPluginRegistration(AnnotationPluginPackage, {
        annotationAuthor: userName,
        selectAfterCreate: false,
        deactivateToolAfterCreate: false,
      }),
      createPluginRegistration(FullscreenPluginPackage),
      createPluginRegistration(ThumbnailPluginPackage, {
        width: 120,
        paddingY: 10,
      }),
      // Commands plugin - provides command execution and state management
      createPluginRegistration(CommandsPluginPackage, {
        commands,
      }),
      // UI plugin - provides schema-driven UI rendering
      createPluginRegistration(UIPluginPackage, {
        schema: viewerUISchema,
      }),
    ],
    [documentUrl]
  );

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (isLoading || !engine) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Mostrar loading mientras se carga el progreso y se navega a la última página
  const showInitialLoading = isLoadingProgress || !isInitialLoadComplete;


  return (
    <BookIdContext.Provider value={bookId}>
      <div
        className="flex h-full flex-1 flex-col overflow-hidden"
        ref={containerRef}
      >
        <div className="flex flex-1 select-none flex-col overflow-hidden">
          <EmbedPDF 
            engine={engine} 
            logger={logger} 
            plugins={plugins}
            onInitialized={handleInitialized}
          >
            {({ pluginsReady, activeDocumentId, documentStates }) => (
              <>
                {pluginsReady ? (
                  <div className="flex h-full flex-col relative">
                    {/* Loading overlay mientras carga progreso y navega */}
                    {showInitialLoading && (
                      <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-4">
                          <LoadingSpinner />
                          <p className="text-sm text-muted-foreground">
                            {isLoadingProgress ? 'Cargando progreso...' : 'Preparando libro...'}
                          </p>
                        </div>
                      </div>
                    )}
                    {/* <TabBar documentStates={documentStates} activeDocumentId={activeDocumentId} /> */}

                    {/* Schema-driven UI with UIProvider */}
                    {activeDocumentId ? (
                      <UIProvider
                        documentId={activeDocumentId}
                        components={uiComponents}
                        renderers={uiRenderers}
                        className="flex min-h-0 flex-1 flex-col overflow-hidden"
                      >
                        <ViewerLayout
                          documentId={activeDocumentId}
                          links={links}
                          bookId={bookId || ""}
                        />
                      </UIProvider>
                    ) : (
                      <EmptyState />
                    )}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <LoadingSpinner message="Initializing plugins..." />
                  </div>
                )}
              </>
            )}
          </EmbedPDF>
        </div>
      </div>
    </BookIdContext.Provider>
  );
}

/**
 * Viewer Layout
 *
 * Main layout component that uses useSchemaRenderer to render toolbars and panels.
 * This component replaces the old SchemaToolbarRenderer and SchemaPanelRenderer.
 */
function ViewerLayout({
  documentId,
  links,
  bookId,
}: {
  documentId: string;
  links: PdfLinkAnnoObject[];
  bookId: string;
}) {
  const { renderToolbar, renderSidebar } = useSchemaRenderer(documentId);

  const annotationMenu = useSelectionMenu("annotation", documentId);
  const redactionMenu = useSelectionMenu("redaction", documentId);
  const selectionMenu = useSelectionMenu("selection", documentId);


  useAnnotationPersistence({
    documentId: documentId,
    bookId: bookId || "",
    enabled: !!documentId && !!bookId,
  });

  return (
    <>
      {/* Main Toolbar */}
      {renderToolbar("top", "main")}

      {/* Secondary Toolbar (annotation/redaction/shapes) - Floating with animation */}
      <div className="pointer-events-none absolute left-0 right-0 top-[3.5rem] z-10 flex justify-center px-4">
        <div className="secondary-toolbar-wrapper pointer-events-auto">
          {renderToolbar("top", "secondary")}
        </div>
      </div>

      {/* Document Content Area */}
      <div
        id="document-content"
        className="flex flex-1 overflow-hidden bg-white"
      >
        {/* Left Panels */}
        {renderSidebar("left", "main")}

        {/* Main Viewer */}
        <div className="flex-1 overflow-hidden">
          <DocumentContent documentId={documentId}>
            {({ documentState, isLoading, isError, isLoaded }) => (
              <>
                {isLoading && (
                  <div className="flex h-full items-center justify-center">
                    <LoadingSpinner message="Loading document..." />
                  </div>
                )}
                {isError && (
                  <DocumentPasswordPrompt documentState={documentState} />
                )}
                {isLoaded && (
                  <div className="relative h-full w-full">
                    <GlobalPointerProvider documentId={documentId}>
                      <Viewport className="bg-gray-100" documentId={documentId}>
                        <ZoomGestureWrapper documentId={documentId}>
                          <Scroller
                            documentId={documentId}
                            renderPage={({ pageIndex }) => (
                              <Rotate
                                documentId={documentId}
                                pageIndex={pageIndex}
                                style={{ backgroundColor: "#fff" }}
                              >
                                <PagePointerProvider
                                  documentId={documentId}
                                  pageIndex={pageIndex}
                                >
                                  <RenderLayer
                                    documentId={documentId}
                                    pageIndex={pageIndex}
                                    scale={1}
                                    style={{ pointerEvents: "none" }}
                                  />
                                  <TilingLayer
                                    documentId={documentId}
                                    pageIndex={pageIndex}
                                    style={{ pointerEvents: "none" }}
                                  />
                                  <SearchLayer
                                    documentId={documentId}
                                    pageIndex={pageIndex}
                                  />
                                  <MarqueeZoom
                                    documentId={documentId}
                                    pageIndex={pageIndex}
                                  />
                                  <MarqueeCapture
                                    documentId={documentId}
                                    pageIndex={pageIndex}
                                  />
                                  <LinkLayer
                                    documentId={documentId}
                                    pageIndex={pageIndex}
                                    links={links}
                                  />
                                  <SelectionLayer
                                    documentId={documentId}
                                    pageIndex={pageIndex}
                                    selectionMenu={selectionMenu}
                                  />
                                  <RedactionLayer
                                    documentId={documentId}
                                    pageIndex={pageIndex}
                                    selectionMenu={redactionMenu}
                                  />
                                  <div data-annotation-layer="true">
                                    <AnnotationLayer
                                      documentId={documentId}
                                      pageIndex={pageIndex}
                                      selectionMenu={annotationMenu}
                                    />
                                  </div>
                                </PagePointerProvider>
                              </Rotate>
                            )}
                          />
                        </ZoomGestureWrapper>
                        {/* Page Controls */}
                        <PageControls documentId={documentId} />
                      </Viewport>
                    </GlobalPointerProvider>
                  </div>
                )}
              </>
            )}
          </DocumentContent>
        </div>

        {/* Right Panels */}
        {renderSidebar("right", "main")}
      </div>
    </>
  );
}
