"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Reply, Flag, Loader2, Image as ImageIcon, X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

interface Comment {
  id: string;
  content: string;
  imageUrls: string[];
  isEdited: boolean;
  createdAt: string;
  isLikedByCurrentUser?: boolean;
  likesCount?: number;
  user: {
    id: string;
    name?: string | null;
    email: string;
    roles?: string[];
    school?: {
      name: string;
    } | null;
  };
  replies?: Comment[];
}

interface GuideForumProps {
  guideSanityId: string;
  entrySanityId?: string;
  comments: Comment[];
  currentUserId?: string;
}

export function GuideForum({ guideSanityId, entrySanityId, comments: initialComments, currentUserId }: GuideForumProps) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [likingComments, setLikingComments] = useState<Set<string>>(new Set());

  // Sync comments when props change (when switching between entries)
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments, entrySanityId]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/guide-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guideSanityId,
          entrySanityId,
          content: newComment.trim(),
          imageUrls: [],
        }),
      });

      if (response.ok) {
        setNewComment("");
        router.refresh();
        // Recargar comentarios
        await refreshComments();
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/guide-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guideSanityId,
          entrySanityId,
          content: replyContent.trim(),
          parentId,
          imageUrls: [],
        }),
      });

      if (response.ok) {
        setReplyTo(null);
        setReplyContent("");
        router.refresh();
        await refreshComments();
      }
    } catch (error) {
      console.error("Error posting reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/guide-comments/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editContent.trim(),
        }),
      });

      if (response.ok) {
        setEditingId(null);
        setEditContent("");
        router.refresh();
        await refreshComments();
      }
    } catch (error) {
      console.error("Error editing comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("¿Estás seguro de eliminar este comentario?")) return;

    try {
      const response = await fetch(`/api/guide-comments/${commentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
        await refreshComments();
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const handleReportComment = async (commentId: string) => {
    const reason = prompt("¿Por qué reportas este comentario?\n\nOpciones: spam, inappropriate, offensive, other");
    if (!reason) return;

    try {
      const response = await fetch("/api/comment-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId,
          reason,
          description: "",
        }),
      });

      if (response.ok) {
        alert("Comentario reportado. Gracias por tu colaboración.");
      }
    } catch (error) {
      console.error("Error reporting comment:", error);
    }
  };

  const refreshComments = async () => {
    try {
      const entryParam = entrySanityId ? `&entrySanityId=${entrySanityId}` : '';
      const response = await fetch(`/api/guide-comments?guideSanityId=${guideSanityId}${entryParam}&parentId=null`);
      const data = await response.json();
      setComments(data.comments);
    } catch (error) {
      console.error("Error refreshing comments:", error);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!currentUserId || likingComments.has(commentId)) return;

    setLikingComments((prev) => new Set(prev).add(commentId));

    try {
      const response = await fetch(`/api/guide-comments/${commentId}/like`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        
        // Actualizar el comentario en el estado local
        setComments((prevComments) =>
          prevComments.map((comment) => {
            if (comment.id === commentId) {
              return {
                ...comment,
                likesCount: data.likesCount,
                isLikedByCurrentUser: data.liked,
              };
            }
            // También actualizar en las respuestas
            if (comment.replies) {
              return {
                ...comment,
                replies: comment.replies.map((reply) =>
                  reply.id === commentId
                    ? {
                        ...reply,
                        likesCount: data.likesCount,
                        isLikedByCurrentUser: data.liked,
                      }
                    : reply
                ),
              };
            }
            return comment;
          })
        );
      }
    } catch (error) {
      console.error("Error liking comment:", error);
    } finally {
      setLikingComments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    }
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isOwner = currentUserId === comment.user.id;
    const isEditing = editingId === comment.id;
    
    // Determinar el nombre de la escuela a mostrar
    const isAdmin = comment.user.roles?.includes("ADMIN");
    const schoolName = isAdmin ? "Al Fin Entendí" : (comment.user.school?.name || "Sin escuela");

    return (
      <div key={comment.id} className={`${isReply ? "ml-12 mt-4" : ""}`}>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-start gap-3">
            <Avatar>
              <AvatarFallback>
                {comment.user.name?.[0]?.toUpperCase() || comment.user.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <p className="font-medium text-sm">
                  {comment.user.name || comment.user.email}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  isAdmin 
                    ? "bg-blue-100 text-blue-700 font-medium" 
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {schoolName}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {comment.isEdited && (
                  <span className="text-xs text-gray-400">(editado)</span>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    disabled={isSubmitting}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEditComment(comment.id)}
                      disabled={isSubmitting}
                    >
                      Guardar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(null);
                        setEditContent("");
                      }}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-gray-700 whitespace-pre-wrap mb-3">{comment.content}</p>

                  {comment.imageUrls && comment.imageUrls.length > 0 && (
                    <div className="flex gap-2 mb-3">
                      {comment.imageUrls.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Imagen ${idx + 1}`}
                          className="w-32 h-32 object-cover rounded"
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 items-center">
                    {currentUserId && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleLikeComment(comment.id)}
                        disabled={likingComments.has(comment.id)}
                        className={comment.isLikedByCurrentUser ? "text-red-500" : ""}
                      >
                        <Heart
                          className={`w-4 h-4 mr-1 ${
                            comment.isLikedByCurrentUser ? "fill-current" : ""
                          }`}
                        />
                        {comment.likesCount || 0}
                      </Button>
                    )}

                    {!isReply && currentUserId && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setReplyTo(comment.id)}
                      >
                        <Reply className="w-4 h-4 mr-1" />
                        Responder
                      </Button>
                    )}

                    {isOwner && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(comment.id);
                            setEditContent(comment.content);
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          Eliminar
                        </Button>
                      </>
                    )}

                    {!isOwner && currentUserId && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReportComment(comment.id)}
                      >
                        <Flag className="w-4 h-4 mr-1" />
                        Reportar
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Formulario de respuesta */}
        {replyTo === comment.id && (
          <div className="ml-12 mt-3 bg-gray-50 rounded-lg border border-gray-200 p-4">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Escribe tu respuesta..."
              rows={3}
              disabled={isSubmitting}
            />
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                onClick={() => handleSubmitReply(comment.id)}
                disabled={isSubmitting || !replyContent.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Responder"
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setReplyTo(null);
                  setReplyContent("");
                }}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Respuestas anidadas */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-4 mt-4">
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          {entrySanityId ? "Discusión de esta entrada" : "Foro de Discusión General"}
        </h2>
        <span className="text-sm text-gray-500">{comments.length} comentarios</span>
      </div>

      {/* Formulario de nuevo comentario */}
      {currentUserId ? (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Comparte tus ideas, preguntas o comentarios..."
            rows={4}
            disabled={isSubmitting}
          />
          <div className="flex justify-end mt-3">
            <Button
              onClick={handleSubmitComment}
              disabled={isSubmitting || !newComment.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publicando...
                </>
              ) : (
                "Publicar comentario"
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
          <p className="text-gray-600">Inicia sesión para participar en la discusión</p>
        </div>
      )}

      {/* Lista de comentarios */}
      {comments.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Aún no hay comentarios</p>
          <p className="text-gray-400 text-sm">Sé el primero en iniciar la conversación</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => renderComment(comment))}
        </div>
      )}
    </div>
  );
}
