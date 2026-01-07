import { useEffect, useRef } from "react";
import { useAnnotationCapability } from "@embedpdf/plugin-annotation/react";
import { AnnotationService } from "@/lib/annotations/annotation-service";

interface UseAnnotationPersistenceProps {
  documentId: string;
  bookId: string;
  enabled?: boolean;
}

// Global map to track which documents have already loaded annotations
// This prevents duplicate loading in React Strict Mode
const loadedDocuments = new Set<string>();

export function useAnnotationPersistence({
  documentId,
  bookId,
  enabled = true,
}: UseAnnotationPersistenceProps) {
  // Get annotation API directly with the document ID

  console.log("🔧 useAnnotationPersistence initialized", { documentId, bookId, enabled });
  const { provides: annotation } = useAnnotationCapability();
  console.log("Annotation plugin ready?",annotation);
  
  const annotationDbIdMap = useRef<Map<string, string>>(new Map());
  
  console.log("🔧 useAnnotationPersistence initialized", { documentId, bookId, enabled, annotationReady: !!annotation });

  // Load annotations from database on mount
  useEffect(() => {
    if (!annotation) {
      console.log("⏳ Annotation plugin not ready yet, waiting...");
      return;
    }
    
    if (!enabled) {
      console.log("⏭️ Persistence disabled");
      return;
    }
    
    // Use documentId + bookId as unique key to prevent duplicate loading
    const loadKey = `${documentId}-${bookId}`;
    if (loadedDocuments.has(loadKey)) {
      console.log("⏭️ Annotations already loaded for this document, skipping");
      return;
    }
    
    console.log("🚀 Loading annotations effect triggered. Annotation ready?", !!annotation);

    const loadAnnotations = async () => {
      try {
        // Mark as loading immediately to prevent race conditions
        loadedDocuments.add(loadKey);
        
        console.log("📥 Fetching annotations from database for bookId:", bookId);
        const dbAnnotations = await AnnotationService.loadAnnotations(bookId);
        console.log("✅ Loaded annotations from DB:", dbAnnotations.length, "annotations");
        console.log("📋 Annotations data:", dbAnnotations);
        
        if (dbAnnotations.length === 0) {
          console.log("ℹ️ No annotations to load");
          return;
        }
        
        // Import annotations into the viewer
        for (const dbAnnotation of dbAnnotations) {
          console.log("📝 Creating annotation in viewer:", dbAnnotation.id, "type:", dbAnnotation.type);
          
          // Skip ink annotations (type 15) that don't have inkPaths
          const annotationType = parseInt(dbAnnotation.type);
          if (annotationType === 15 && !dbAnnotation.inkPaths) {
            console.warn("⚠️ Skipping ink annotation without inkPaths:", dbAnnotation.id);
            continue;
          }
          
          // Track the DB ID BEFORE creating to prevent re-saving
          annotationDbIdMap.current.set(dbAnnotation.id, dbAnnotation.id);
          
          annotation?.createAnnotation(dbAnnotation.pageIndex, {
            id: dbAnnotation.id,
            type: annotationType,
            color: dbAnnotation.color || undefined,
            opacity: dbAnnotation.opacity ?? undefined,
            blendMode: dbAnnotation.blendMode ? parseInt(dbAnnotation.blendMode) : undefined,
            strokeWidth: dbAnnotation.strokeWidth ?? undefined,
            rect: dbAnnotation.rect,
            segmentRects: dbAnnotation.segmentRects || undefined,
            inkPaths: dbAnnotation.inkPaths || undefined,
            inkList: dbAnnotation.inkPaths || undefined,
            lineCoordinates: dbAnnotation.lineCoordinates || undefined,
            vertices: dbAnnotation.vertices || undefined,
            custom: dbAnnotation.customData || undefined,
          } as any);
        }
        
        console.log("🎉 All annotations loaded successfully!");
      } catch (error) {
        console.error('❌ Error loading annotations:', error);
        // Remove from loaded set on error so it can retry
        loadedDocuments.delete(loadKey);
      }
    };

    loadAnnotations();
  }, [annotation, bookId, documentId, enabled]);

  // Listen to annotation events and save to database
  useEffect(() => {
    console.log("🚀 Listening to annotation events for document:", documentId);
    if (!annotation || !enabled) return;

    const unsubscribe = annotation.onAnnotationEvent(async (event) => {
      console.log(`Annotation event: ${event.type}`, { event });

      try {
        if (event.type === 'create' && event.committed) {
          // Don't save if it was loaded from DB
          if (annotationDbIdMap.current.has(event.annotation.id)) return;

          // Save new annotation to database
          const anno = event.annotation as any;
          console.log({anno})
          console.log('💾 Saving annotation - type:', anno.type, 'inkPaths:', anno.inkPaths, 'inkList:', anno.inkList, 'paths:', anno.paths);

          const inkData =
            anno.inkPaths ??
            anno.paths ??
            anno.inkList;
          
          const savedAnnotation = await AnnotationService.saveAnnotation({
            bookId,
            pageIndex: event.pageIndex,
            type: String(anno.type),
            content: anno.content,
            color: anno.color,
            opacity: anno.opacity,
            blendMode: anno.blendMode,
            strokeWidth: anno.strokeWidth,
            rect: anno.rect,
            segmentRects: anno.segmentRects,
            inkPaths: inkData, // Try inkPaths, paths, then inkList
            lineCoordinates: anno.lineCoordinates,
            vertices: anno.vertices,
            customData: anno.custom,
          });

          // Track the DB ID
          annotationDbIdMap.current.set(event.annotation.id, savedAnnotation.id);
          console.log('Annotation saved to database:', savedAnnotation.id);
        }

        if (event.type === 'update') {
          const patch = (event as any).patch;
          const hasMeaningfulPatch =
            !!patch &&
            Object.keys(patch).some((key) =>
              ['color', 'opacity', 'blendMode', 'strokeWidth', 'rect', 'custom', 'customData', 'author'].includes(key)
            );
          if (!event.committed && !hasMeaningfulPatch) {
            console.log('🛑 Skipping non-committed update without relevant patch');
            return;
          }

          const dbId = annotationDbIdMap.current.get(event.annotation.id);
          console.log('🔄 Update event - annotation.id:', event.annotation.id, 'dbId:', dbId);
          console.log('📋 Current map:', Array.from(annotationDbIdMap.current.entries()));
          
          if (!dbId) {
            console.warn('⚠️ No dbId found for annotation:', event.annotation.id);
            return;
          }

          // Update annotation in database
          const anno = event.annotation as any;
          console.log('✏️ Persisting annotation patch', patch);
          await AnnotationService.updateAnnotation(dbId, {
            color: anno.color,
            opacity: anno.opacity,
            blendMode: anno.blendMode,
            strokeWidth: anno.strokeWidth,
            rect: anno.rect,
            customData: anno.custom,
          });
          console.log('✅ Annotation updated in database:', dbId);
        }

        if (event.type === 'delete' && event.committed) {
          const dbId = annotationDbIdMap.current.get(event.annotation.id);
          if (!dbId) return;

          // Delete annotation from database
          await AnnotationService.deleteAnnotation(dbId);
          annotationDbIdMap.current.delete(event.annotation.id);
          console.log('Annotation deleted from database:', dbId);
        }
      } catch (error) {
        console.error(`Error handling ${event.type} event:`, error);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [annotation, bookId, enabled]);

  return null;
}
