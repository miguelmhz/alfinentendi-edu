"use client";

import { useAnnotation } from "@embedpdf/plugin-annotation/react";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Trash2, X } from "lucide-react";

interface CommentSidebarProps {
  documentId: string;
  bookId?: string;
}

// Map annotation type numbers to readable names
const getAnnotationTypeName = (type: number): string => {
  const typeMap: Record<number, string> = {
    1: "Texto",
    2: "Enlace",
    3: "Texto Libre",
    4: "Línea",
    5: "Cuadrado",
    6: "Círculo",
    7: "Polígono",
    8: "Polilínea",
    9: "Resaltado",
    10: "Subrayado",
    11: "Tachado",
    12: "Sello",
    13: "Tinta",
    14: "Popup",
    15: "Archivo Adjunto",
  };
  return typeMap[type] || `Tipo ${type}`;
};

interface AnnotationComment {
  annotationId: string;
  pageIndex: number;
  comment: string;
  createdAt: Date;
  annotationType: any;
  authorName?: string;
  authorEmail?: string;
}

export const CommentSidebar = ({ documentId, bookId }: CommentSidebarProps) => {
  const { provides: annotation } = useAnnotation(documentId);
  const [comments, setComments] = useState<AnnotationComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Get selected annotation directly without memoization to avoid dependency issues
  const selectedAnnotation = annotation?.getSelectedAnnotation();

  // Load comments from database on mount
  useEffect(() => {
    const loadComments = async () => {
      if (!bookId) return;

      try {
        console.log("📥 Loading comments for bookId:", bookId);
        const response = await fetch(`/api/comments?bookId=${bookId}`);
        
        if (!response.ok) {
          throw new Error('Failed to load comments');
        }

        const dbComments = await response.json();
        console.log("✅ Loaded comments from DB:", dbComments.length);

        // Transform DB comments to component format
        const transformedComments: AnnotationComment[] = dbComments.map((c: any) => ({
          annotationId: c.annotationId,
          pageIndex: c.annotation.pageIndex,
          comment: c.content,
          createdAt: new Date(c.createdAt),
          annotationType: c.annotation.type,
          authorName: c.user?.name || 'Usuario',
          authorEmail: c.user?.email,
        }));

        setComments(transformedComments);
      } catch (error) {
        console.error('Error loading comments:', error);
      }
    };

    loadComments();
  }, [bookId]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedAnnotation) return;

    setIsLoading(true);
    try {
      // Save comment to database
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annotationId: selectedAnnotation.object.id,
          content: newComment.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save comment');
      }

      const savedComment = await response.json();

      const comment: AnnotationComment = {
        annotationId: selectedAnnotation.object.id,
        pageIndex: selectedAnnotation.object.pageIndex,
        comment: newComment.trim(),
        createdAt: new Date(savedComment.createdAt),
        annotationType: selectedAnnotation.object.type,
        authorName: savedComment.user?.name || 'Usuario',
        authorEmail: savedComment.user?.email,
      };

      setComments([...comments, comment]);
      setNewComment("");
      console.log('✅ Comment saved successfully:', savedComment.id);
    } catch (error) {
      console.error('Error saving comment:', error);
      alert('Error al guardar el comentario: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = (index: number) => {
    setComments(comments.filter((_, i) => i !== index));
  };

  const annotationComments = selectedAnnotation
    ? comments.filter((c) => c.annotationId === selectedAnnotation.object.id)
    : [];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquare className="h-4 w-4" />
          Comentarios de Anotaciones
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {selectedAnnotation
            ? "Agrega comentarios a la anotación seleccionada"
            : "Selecciona una anotación para agregar comentarios"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {selectedAnnotation ? (
          <div className="space-y-4">
            {/* Selected annotation info */}
            <div className="rounded-lg border bg-muted/50 p-3">
              <div className="text-xs font-medium text-muted-foreground">
                Anotación seleccionada
              </div>
              <div className="mt-1 text-sm">
                Tipo: {getAnnotationTypeName(selectedAnnotation.object.type)}
              </div>
              <div className="text-xs text-muted-foreground">
                Página {Number(selectedAnnotation?.object?.pageIndex || 0) + 1}
              </div>
            </div>

            {/* Comment input */}
            <div className="space-y-2">
              <Textarea
                placeholder="Escribe un comentario..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px] resize-none"
              />
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || isLoading}
                className="w-full"
                size="sm"
              >
                {isLoading ? "Guardando..." : "Agregar Comentario"}
              </Button>
            </div>

            <Separator />

            {/* Comments list */}
            <div className="space-y-3">
              <div className="text-xs font-medium text-muted-foreground">
                Comentarios ({annotationComments.length})
              </div>
              {annotationComments.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  No hay comentarios aún
                </p>
              ) : (
                annotationComments.map((comment, index) => (
                  <div
                    key={index}
                    className="rounded-lg border bg-background p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-xs font-medium text-primary">
                            {comment.authorName || 'Usuario'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {comment.createdAt.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{comment.comment}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          handleDeleteComment(
                            comments.findIndex((c) => c === comment)
                          )
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              Selecciona una anotación en el documento para agregar comentarios
            </p>
          </div>
        )}
      </div>

      {/* All comments section */}
      {comments.length > 0 && !selectedAnnotation && (
        <div className="border-t">
          <div className="h-[200px] overflow-y-auto p-4">
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                Todos los comentarios ({comments.length})
              </div>
              {comments.map((comment, index) => (
                <div
                  key={index}
                  className="rounded-lg border bg-background p-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          Página {comment.pageIndex + 1}
                        </span>
                        <span className="text-primary">
                          • {comment.authorName || 'Usuario'}
                        </span>
                      </div>
                      <p className="mt-1 text-muted-foreground">
                        {comment.comment}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => handleDeleteComment(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
