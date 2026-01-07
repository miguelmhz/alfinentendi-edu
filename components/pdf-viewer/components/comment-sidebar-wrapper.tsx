"use client";

import { CommentSidebar } from "./comment-sidebar";
import { createContext, useContext } from "react";

// Create a context to share bookId across components
export const BookIdContext = createContext<string | undefined>(undefined);

interface CommentSidebarWrapperProps {
  documentId: string;
}

export const CommentSidebarWrapper = ({ documentId }: CommentSidebarWrapperProps) => {
  // Get bookId from context
  const bookId = useContext(BookIdContext);
  
  return <CommentSidebar documentId={documentId} bookId={bookId} />;
};
