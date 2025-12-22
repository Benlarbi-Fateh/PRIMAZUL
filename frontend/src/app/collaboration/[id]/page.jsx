// /pages/collaboration/[id].js
"use client";

import { useRouter } from "next/router";
import TaskBoard from "@/components/collaboration/TaskBoard";

export default function Collaboration() {
  const router = useRouter();
  const { id } = router.query;

  if (!id) return <div>Chargement...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Collaboration - Conversation {id}</h1>
      <TaskBoard conversationId={id} />
    </div>
  );
}
