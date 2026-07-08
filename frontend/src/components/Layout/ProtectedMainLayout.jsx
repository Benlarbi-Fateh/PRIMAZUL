"use client";

import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import MainSidebar from "@/components/Layout/MainSidebar.client";

export default function ProtectedMainLayout({
  children,
  className = "flex min-h-screen",
  contentClassName = "flex-1 min-w-0",
}) {
  return (
    <ProtectedRoute>
      <div className={className}>
        <MainSidebar />
        <div className={contentClassName}>{children}</div>
      </div>
    </ProtectedRoute>
  );
}
