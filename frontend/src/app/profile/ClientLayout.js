"use client";

import MainSidebar from "@/components/Layout/MainSidebar.client";
import { AuthProvider } from "@/context/AuthProvider";

export default function ClientLayout({ children }) {
  return (
    <AuthProvider>
      <div className="flex">
        <MainSidebar />
        <div className="flex-1 h-full">{children}</div>
      </div>
    </AuthProvider>
  );
}
