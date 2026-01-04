"use client";

import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user: {
    id: string;
    name?: string | null;
    email: string;
  };
}

interface BookReviewsProps {
  bookSanityId: string;
  reviews: Review[];
  stats: {
    averageRating: number;
    totalReviews: number;
  };
  currentUserId?: string;
  userReview?: Review;
}

export function BookReviews({
  bookSanityId,
  reviews: initialReviews,
  stats: initialStats,
  currentUserId,
  userReview: initialUserReview,
}: BookReviewsProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [stats, setStats] = useState(initialStats);
  const [userReview, setUserReview] = useState(initialUserReview);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(userReview?.rating || 0);
  const [comment, setComment] = useState(userReview?.comment || "");
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmitReview = async () => {
    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      const url = userReview
        ? `/api/book-reviews/${userReview.id}`
        : "/api/book-reviews";
      
      const method = userReview ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookSanityId,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      if (response.ok) {
        router.refresh();
        // Recargar reviews
        const reviewsResponse = await fetch(`/api/book-reviews?bookSanityId=${bookSanityId}`);
        const data = await reviewsResponse.json();
        setReviews(data.reviews);
        setStats(data.stats);
        setUserReview(data.reviews.find((r: Review) => r.user.id === currentUserId));
      } else {
        const error = await response.json();
        alert(error.error || "Error al guardar la reseña");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Error al guardar la reseña");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview || !confirm("¿Estás seguro de eliminar tu reseña?")) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/book-reviews/${userReview.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setRating(0);
        setComment("");
        setUserReview(undefined);
        router.refresh();
        
        // Recargar reviews
        const reviewsResponse = await fetch(`/api/book-reviews?bookSanityId=${bookSanityId}`);
        const data = await reviewsResponse.json();
        setReviews(data.reviews);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error deleting review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (count: number, interactive = false, size = "w-5 h-5") => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= (interactive ? hoveredRating || rating : count)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            } ${interactive ? "cursor-pointer transition-colors" : ""}`}
            onClick={interactive ? () => setRating(star) : undefined}
            onMouseEnter={interactive ? () => setHoveredRating(star) : undefined}
            onMouseLeave={interactive ? () => setHoveredRating(0) : undefined}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Resumen de calificaciones */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold mb-4">Reseñas y Calificaciones</h2>
        
        {stats.totalReviews > 0 ? (
          <div className="flex items-center gap-6 mb-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{stats.averageRating.toFixed(1)}</div>
              {renderStars(Math.round(stats.averageRating))}
              <p className="text-sm text-gray-500 mt-2">{stats.totalReviews} reseñas</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 mb-6">Aún no hay reseñas para este libro</p>
        )}

        {/* Formulario de reseña */}
        {currentUserId && (
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">
              {userReview ? "Tu reseña" : "Deja tu reseña"}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Calificación</label>
                {renderStars(rating, true)}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Comentario (opcional)
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Comparte tu opinión sobre este libro..."
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSubmitReview}
                  disabled={isSubmitting || rating === 0}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : userReview ? (
                    "Actualizar reseña"
                  ) : (
                    "Publicar reseña"
                  )}
                </Button>
                
                {userReview && (
                  <Button
                    variant="outline"
                    onClick={handleDeleteReview}
                    disabled={isSubmitting}
                  >
                    Eliminar
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de reseñas */}
      {reviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Todas las reseñas</h3>
          
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-start gap-3">
                <Avatar>
                  <AvatarFallback>
                    {review.user.name?.[0]?.toUpperCase() || review.user.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{review.user.name || review.user.email}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString("es-MX", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    {renderStars(review.rating, false, "w-4 h-4")}
                  </div>
                  
                  {review.comment && (
                    <p className="text-gray-700 whitespace-pre-wrap">{review.comment}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
