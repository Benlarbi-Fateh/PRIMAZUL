"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { TaskProvider } from "@/context/TaskContext";
import MainSidebar from "@/components/Layout/MainSidebar.client";
import ProjectSidebar from "@/components/Tasks/ProjectSidebar";
import TaskBoard from "@/components/Tasks/TaskBoard";

export default function TasksPage() {
  const { id: conversationId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    // Fond avec bleu plus marqué - MODIFIÉ POUR MODE SOMBRE BLEU
    <div className="flex h-[100dvh] overflow-hidden bg-gradient-to-br from-blue-200/30 via-blue-100/20 to-white dark:bg-gradient-to-br dark:from-blue-950 dark:via-blue-900 dark:to-blue-800 text-blue-900 dark:text-slate-100 transition-colors duration-300">
      {/* Sidebar principale */}
      <div className="hidden md:block z-50">
        <MainSidebar />
      </div>

      <TaskProvider conversationId={conversationId}>
        <div className="flex flex-1 w-full overflow-hidden relative">
          {/* Sidebar Projet */}
          <ProjectSidebar
            conversationId={conversationId}
            isOpen={sidebarOpen}
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />

          {/* Zone principale */}
          <main className="flex-1 relative flex flex-col min-w-0 overflow-hidden">
            <TaskBoard toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          </main>
        </div>
      </TaskProvider>
    </div>
  );
}