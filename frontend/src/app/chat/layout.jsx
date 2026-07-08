"use client";

import { useParams } from "next/navigation";
import ProtectedMainLayout from "@/components/Layout/ProtectedMainLayout";
import Sidebar from "@/components/Layout/Sidebar";

export default function ChatLayout({ children }) {
  const params = useParams();
  const activeConversationId = params?.id;

  return (
    <ProtectedMainLayout
      className="flex h-screen min-h-0"
      contentClassName="flex flex-1 min-w-0 min-h-0"
    >
        <div className="hidden lg:block shrink-0">
          <Sidebar activeConversationId={activeConversationId} />
        </div>

        <div className="flex-1 min-w-0 min-h-0">{children}</div>
    </ProtectedMainLayout>
  );
}
