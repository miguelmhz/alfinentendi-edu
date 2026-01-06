// Service for saving and loading annotations from the database

interface AnnotationData {
  id?: string;
  bookId: string;
  pageIndex: number;
  type: string;
  content?: string;
  color?: string;
  opacity?: number;
  blendMode?: string;
  strokeWidth?: number;
  rect: any;
  segmentRects?: any;
  inkPaths?: any;
  lineCoordinates?: any;
  vertices?: any;
  customData?: any;
}

export class AnnotationService {
  static async saveAnnotation(data: AnnotationData): Promise<any> {
    try {
      const response = await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save annotation');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving annotation:', error);
      throw error;
    }
  }

  static async loadAnnotations(bookId: string): Promise<any[]> {
    try {
      const response = await fetch(`/api/annotations?bookId=${bookId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load annotations');
      }

      return await response.json();
    } catch (error) {
      console.error('Error loading annotations:', error);
      return [];
    }
  }

  static async updateAnnotation(id: string, updates: Partial<AnnotationData>): Promise<any> {
    try {
      const response = await fetch(`/api/annotations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update annotation');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating annotation:', error);
      throw error;
    }
  }

  static async deleteAnnotation(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/annotations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete annotation');
      }
    } catch (error) {
      console.error('Error deleting annotation:', error);
      throw error;
    }
  }

  static async saveComment(annotationId: string, content: string): Promise<any> {
    try {
      const response = await fetch(`/api/annotations/${annotationId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to save comment');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving comment:', error);
      throw error;
    }
  }

  static async deleteComment(commentId: string): Promise<void> {
    try {
      const response = await fetch(`/api/annotations/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }
}
