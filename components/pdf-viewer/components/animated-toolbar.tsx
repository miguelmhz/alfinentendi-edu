"use client";

import { ReactNode, useEffect, useState } from "react";

interface AnimatedToolbarProps {
  children: ReactNode;
  isVisible: boolean;
}

export const AnimatedToolbar = ({ children, isVisible }: AnimatedToolbarProps) => {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      // Small delay to trigger animation
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before unmounting
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div className="pointer-events-none absolute left-0 right-0 top-[3.5rem] z-10 flex justify-center px-4">
      <div
        className={`
          pointer-events-auto
          transform
          transition-all
          duration-300
          ease-out
          ${isAnimating 
            ? 'translate-y-0 opacity-100' 
            : '-translate-y-4 opacity-0'
          }
        `}
        style={{
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        }}
      >
        {children}
      </div>
    </div>
  );
};
