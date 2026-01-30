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
    <div className="flex h-[100dvh] overflow-hidden bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] dark:from-[#0B1120] dark:to-[#0B1120] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Navigation principale (Sidebar fine) */}
      <div className="hidden md:block z-50">
        <MainSidebar />
      </div>

      {/* Contexte des tâches */}
      <TaskProvider conversationId={conversationId}>
        <div className="flex flex-1 w-full overflow-hidden relative">
          {/* Sidebar Projet (Liste des projets) */}
          <ProjectSidebar
            conversationId={conversationId}
            isOpen={sidebarOpen}
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />

          {/* Zone principale (Tableau) */}
          {/* On ajoute un backdrop-blur pour que le contenu glisse élégamment sur le fond */}
          <main className="flex-1 relative flex flex-col min-w-0 overflow-hidden bg-white/30 dark:bg-slate-900/50 backdrop-blur-sm">
            <TaskBoard toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          </main>
        </div>
      </TaskProvider>
    </div>
  );
}
