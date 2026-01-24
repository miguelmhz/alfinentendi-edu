import { useEffect, useRef, useState } from "react";

interface UseReadingLogProps {
  bookSanityId: string;
  enabled?: boolean;
}

export function useReadingLog({ bookSanityId, enabled = true }: UseReadingLogProps) {
  const [logId, setLogId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagesViewed, setPagesViewed] = useState(0);
  const sessionStartRef = useRef<Date | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Detectar tipo de dispositivo
  const getDeviceType = () => {
    const width = window.innerWidth;
    if (width < 768) return "mobile";
    if (width < 1024) return "tablet";
    return "desktop";
  };

  // Iniciar sesión de lectura
  useEffect(() => {
    if (!enabled || !bookSanityId) return;

    const startReadingSession = async () => {
      try {
        const response = await fetch("/api/books/reading-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookSanityId,
            deviceType: getDeviceType(),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setLogId(data.logId);
          sessionStartRef.current = new Date();
          console.log("Reading session started:", data.logId);
        }
      } catch (error) {
        console.error("Error starting reading session:", error);
      }
    };

    startReadingSession();

    return () => {
      // Cleanup al desmontar
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [bookSanityId, enabled]);

  // Actualizar log periódicamente
  useEffect(() => {
    if (!logId || !enabled) return;

    // Actualizar cada 30 segundos
    updateIntervalRef.current = setInterval(() => {
      updateReadingLog();
    }, 30000);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [logId, currentPage, pagesViewed, enabled]);

  // Actualizar log al cambiar de página
  useEffect(() => {
    if (logId && currentPage > 0) {
      updateReadingLog();
    }
  }, [currentPage]);

  const updateReadingLog = async () => {
    if (!logId || !sessionStartRef.current) return;

    const duration = Math.floor(
      (new Date().getTime() - sessionStartRef.current.getTime()) / 1000
    );

    try {
      await fetch(`/api/books/reading-logs/${logId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pagesViewed,
          lastPage: currentPage,
          duration,
        }),
      });
    } catch (error) {
      console.error("Error updating reading log:", error);
    }
  };

  // Actualizar al cerrar/salir de la página
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (logId) {
        updateReadingLog();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Última actualización al desmontar
      if (logId) {
        updateReadingLog();
      }
    };
  }, [logId, currentPage, pagesViewed]);

  return {
    setCurrentPage,
    setPagesViewed,
    logId,
  };
}
