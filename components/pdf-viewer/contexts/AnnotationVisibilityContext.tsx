import { createContext, useContext, useState, ReactNode } from 'react';

interface AnnotationVisibilityContextType {
  showAnnotations: boolean;
  toggleAnnotations: () => void;
}

const AnnotationVisibilityContext = createContext<AnnotationVisibilityContextType | undefined>(undefined);

export function AnnotationVisibilityProvider({ children }: { children: ReactNode }) {
  const [showAnnotations, setShowAnnotations] = useState(true);

  const toggleAnnotations = () => {
    setShowAnnotations(prev => !prev);
  };

  return (
    <AnnotationVisibilityContext.Provider value={{ showAnnotations, toggleAnnotations }}>
      {children}
    </AnnotationVisibilityContext.Provider>
  );
}

export function useAnnotationVisibility() {
  const context = useContext(AnnotationVisibilityContext);
  if (!context) {
    throw new Error('useAnnotationVisibility must be used within AnnotationVisibilityProvider');
  }
  return context;
}
