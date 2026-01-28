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
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* 1. Main Navigation (Tout à gauche) */}
      <MainSidebar />

      {/* 2. Task Provider Wrapper */}
      <TaskProvider conversationId={conversationId}>
        {/* 3. Project Sidebar (Responsive) */}
        <ProjectSidebar
          conversationId={conversationId}
          isOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* 4. Main Content Area */}
        <main className="flex-1 relative flex flex-col min-w-0 overflow-hidden">
          <TaskBoard toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        </main>
      </TaskProvider>
    </div>
  );
}
