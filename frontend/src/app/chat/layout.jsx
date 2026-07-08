"use client";

import { useParams } from "next/navigation";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import MainSidebar from "@/components/Layout/MainSidebar.client";
import Sidebar from "@/components/Layout/Sidebar";

export default function ChatLayout({ children }) {
  const params = useParams();
  const activeConversationId = params?.id;

  return (
    <ProtectedRoute>
      <div className="flex h-screen min-h-0">
        <MainSidebar />

        <div className="hidden lg:block shrink-0">
          <Sidebar activeConversationId={activeConversationId} />
        </div>

        <div className="flex-1 min-w-0 min-h-0">{children}</div>
      </div>
    </ProtectedRoute>
  );
}
