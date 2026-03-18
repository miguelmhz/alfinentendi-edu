import { useEffect, useState, useCallback } from "react";

interface UseBookProgressProps {
  bookSanityId: string;
  userId?: string;
  enabled?: boolean;
}

interface BookProgress {
  lastPage: number;
  totalPages: number;
  lastUpdated: string;
}

const STORAGE_KEY_PREFIX = "book_progress_";

/**
 * Hook híbrido para manejar el progreso de lectura
 * Offline-first: localStorage como caché, DB como fuente de verdad
 */
export function useBookProgress({ 
  bookSanityId, 
  userId,
  enabled = true 
}: UseBookProgressProps) {
  const [lastPage, setLastPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const storageKey = `${STORAGE_KEY_PREFIX}${bookSanityId}`;

  // Cargar progreso desde localStorage (instantáneo)
  const loadFromLocalStorage = useCallback((): BookProgress | null => {
    if (typeof window === "undefined") return null;
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error);
    }
    return null;
  }, [storageKey]);

  // Guardar en localStorage (instantáneo)
  const saveToLocalStorage = useCallback((progress: BookProgress) => {
    if (typeof window === "undefined") return;
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }, [storageKey]);

  // Cargar progreso desde DB (sincronización)
  const loadFromDatabase = useCallback(async (): Promise<number | null> => {
    if (!enabled || !bookSanityId || !userId) return null;

    try {
      const response = await fetch(
        `/api/books/progress/${bookSanityId}?userId=${userId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.lastPage || null;
      }
    } catch (error) {
      console.error("Error loading progress from DB:", error);
    }
    return null;
  }, [bookSanityId, userId, enabled]);

  // Guardar en DB (background sync)
  const saveToDatabase = useCallback(async (page: number) => {
    if (!enabled || !bookSanityId) return;

    try {
      await fetch(`/api/books/progress/${bookSanityId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastPage: page }),
      });
    } catch (error) {
      console.error("Error saving progress to DB:", error);
      // No bloqueamos la UI si falla la DB
    }
  }, [bookSanityId, enabled]);

  // Inicializar: cargar desde localStorage primero, luego sincronizar con DB
  useEffect(() => {
    if (!enabled || !bookSanityId) {
      setIsLoading(false);
      return;
    }

    const initialize = async () => {
      // 1. Cargar instantáneamente desde localStorage
      const localProgress = loadFromLocalStorage();
      if (localProgress) {
        setLastPage(localProgress.lastPage);
        console.log("📖 Restored from localStorage:", localProgress.lastPage);
      }

      // 2. Sincronizar con DB en background
      if (userId) {
        setIsSyncing(true);
        const dbPage = await loadFromDatabase();
        
        if (dbPage !== null) {
          // Si la DB tiene un valor más reciente, usarlo
          if (!localProgress || dbPage > localProgress.lastPage) {
            setLastPage(dbPage);
            saveToLocalStorage({
              lastPage: dbPage,
              totalPages: localProgress?.totalPages || 0,
              lastUpdated: new Date().toISOString(),
            });
            console.log("🔄 Synced from DB:", dbPage);
          }
        }
        setIsSyncing(false);
      }

      setIsLoading(false);
    };

    initialize();
  }, [bookSanityId, userId, enabled, loadFromLocalStorage, loadFromDatabase, saveToLocalStorage]);

  // Actualizar progreso (offline-first)
  const updateProgress = useCallback((page: number, totalPages?: number) => {
    if (!enabled) return;

    const progress: BookProgress = {
      lastPage: page,
      totalPages: totalPages || 0,
      lastUpdated: new Date().toISOString(),
    };

    // 1. Guardar inmediatamente en localStorage (offline-first)
    saveToLocalStorage(progress);
    setLastPage(page);

    // 2. Sincronizar con DB en background (no bloqueante)
    saveToDatabase(page);

    console.log("💾 Progress saved:", page);
  }, [enabled, saveToLocalStorage, saveToDatabase]);

  return {
    lastPage,
    updateProgress,
    isLoading,
    isSyncing,
  };
}
