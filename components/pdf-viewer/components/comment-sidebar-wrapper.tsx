"use client";

import { CommentSidebar } from "./comment-sidebar";
import { useSearchParams } from "next/navigation";

interface CommentSidebarWrapperProps {
  documentId: string;
}

export const CommentSidebarWrapper = ({ documentId }: CommentSidebarWrapperProps) => {
  // Get bookId from URL or other source
  // For now, we'll need to pass it through a different mechanism
  // This is a temporary solution - ideally bookId should come from context
  
  return <CommentSidebar documentId={documentId} bookId={undefined} />;
};
