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
    // Fond Blanc pur en mode clair, Slate-950 en sombre
    <div className="flex h-[100dvh] overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Sidebar principale (Cachée sur mobile) */}
      <div className="hidden md:block z-50">
        <MainSidebar />
      </div>

      <TaskProvider conversationId={conversationId}>
        <div className="flex flex-1 w-full overflow-hidden relative">
          {/* Sidebar Projet (Responsive : Drawer sur mobile, fixe sur desktop) */}
          <ProjectSidebar
            conversationId={conversationId}
            isOpen={sidebarOpen}
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />

          {/* Zone principale */}
          <main className="flex-1 relative flex flex-col min-w-0 overflow-hidden bg-white dark:bg-slate-950">
            {/* On passe toggleSidebar pour le bouton menu mobile */}
            <TaskBoard toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          </main>
        </div>
      </TaskProvider>
    </div>
  );
}
