"use client";

import { useCallback } from "react";
import api, { archiveConversation } from "@/lib/api";

export function useConversationActions({
  fetchConversations,
  getOtherParticipant,
  setHiddenConversationIds,
  setMenuOpen,
}) {
  const handleBlockConversationContact = useCallback(
    async (conv) => {
      if (conv.isGroup) return;
      const contact = getOtherParticipant(conv);
      if (!contact?._id) return alert("Contact non defini");

      if (
        !confirm(
          `Etes-vous sur de vouloir bloquer ${contact.name} ?\n\nConsequences :\n- ${contact.name} sera RETIRE de vos contacts\n- Votre conversation sera MASQUEE (pas supprimee)\n- Vous ne recevrez plus ses messages\n- Il ne pourra plus vous contacter`,
        )
      ) {
        return;
      }

      try {
        const response = await api.post("/message-settings/block", {
          targetUserId: contact._id,
        });
        if (response.data?.success) {
          window.dispatchEvent(new CustomEvent("block-status-changed"));
          await fetchConversations();
          alert(`${contact.name} a ete bloque et retire de vos contacts`);
        } else {
          throw new Error(response.data?.message || "Erreur inconnue");
        }
      } catch (err) {
        console.error("Erreur blocage (sidebar):", err);
        alert(
          "Erreur lors du blocage: " +
            (err.response?.data?.message || err.message),
        );
      } finally {
        setMenuOpen(null);
      }
    },
    [fetchConversations, getOtherParticipant, setMenuOpen],
  );

  const handleArchiveConversation = useCallback(
    async (conv) => {
      if (!confirm(`Archiver cette discussion ?`)) return;

      setHiddenConversationIds((prev) => {
        const next = new Set(prev);
        next.add(conv._id);
        return next;
      });
      setMenuOpen(null);

      try {
        await archiveConversation(conv._id);
      } catch (error) {
        console.error("Erreur archivage:", error);
        alert("Erreur lors de l'archivage");
      }
    },
    [setHiddenConversationIds, setMenuOpen],
  );

  const handleClearConversation = useCallback(
    async (conv) => {
      if (!confirm(`Vider cette discussion ?`)) return;

      try {
        await api.delete(`/message-settings/conversations/${conv._id}/delete`);
        setMenuOpen(null);
        window.dispatchEvent(
          new CustomEvent("conversation-cleared", {
            detail: { conversationId: conv._id },
          }),
        );
        await fetchConversations();
        alert("Discussion videe");
      } catch (error) {
        console.error("Erreur vidage discussion:", error);
        alert("Erreur lors du vidage");
      }
    },
    [fetchConversations, setMenuOpen],
  );

  return {
    handleBlockConversationContact,
    handleArchiveConversation,
    handleClearConversation,
  };
}
