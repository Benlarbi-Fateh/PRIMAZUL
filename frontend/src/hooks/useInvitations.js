"use client";

import { useCallback, useEffect, useState } from "react";
import {
  acceptInvitation,
  cancelInvitation,
  getReceivedInvitations,
  getSentInvitations,
  rejectInvitation,
  sendInvitation,
} from "@/lib/api";
import {
  emitInvitationAccepted,
  emitInvitationCancelled,
  emitInvitationRejected,
  emitInvitationSent,
  onInvitationAccepted,
  onInvitationCancelled,
  onInvitationReceived,
  onInvitationRejected,
} from "@/services/socket";

export function useInvitations({
  user,
  activeTab,
  setActiveTab,
  setSearchTerm,
  setSearchResults,
  router,
  fetchConversations,
  updateConversations,
}) {
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [receivedInvitations, setReceivedInvitations] = useState([]);
  const [sentInvitations, setSentInvitations] = useState([]);
  const [invitationTab, setInvitationTab] = useState("received");

  const fetchInvitations = useCallback(async () => {
    try {
      if (activeTab === "invitations" && receivedInvitations.length === 0) {
        setInvitationsLoading(true);
      }

      const [received, sent] = await Promise.all([
        getReceivedInvitations(),
        getSentInvitations(),
      ]);
      setReceivedInvitations(received.data.invitations || []);
      setSentInvitations(sent.data.invitations || []);
    } catch (error) {
      console.error("Erreur chargement invitations:", error);
    } finally {
      setInvitationsLoading(false);
    }
  }, [activeTab, receivedInvitations.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.dispatchEvent(
      new CustomEvent("invitations-count-changed", {
        detail: { count: receivedInvitations.length },
      }),
    );
  }, [receivedInvitations.length]);

  useEffect(() => {
    if (!user) return;

    const handleInvitationReceived = (invitation) => {
      setReceivedInvitations((prev) => [invitation, ...prev]);
    };

    const handleInvitationAccepted = ({ invitation, conversation }) => {
      setSentInvitations((prev) =>
        prev.filter((inv) => inv._id !== invitation._id),
      );
      updateConversations((prev) => [conversation, ...prev]);
    };

    const handleInvitationRejected = (invitation) => {
      setSentInvitations((prev) =>
        prev.filter((inv) => inv._id !== invitation._id),
      );
    };

    const handleInvitationCancelled = (invitationId) => {
      setReceivedInvitations((prev) =>
        prev.filter((inv) => inv._id !== invitationId),
      );
    };

    onInvitationReceived(handleInvitationReceived);
    onInvitationAccepted(handleInvitationAccepted);
    onInvitationRejected(handleInvitationRejected);
    onInvitationCancelled(handleInvitationCancelled);
  }, [user, updateConversations]);

  const handleSendInvitation = useCallback(
    async (userId) => {
      try {
        setInvitationsLoading(true);
        const response = await sendInvitation({ receiverId: userId });
        setSentInvitations((prev) => [response.data.invitation, ...prev]);
        emitInvitationSent({
          receiverId: userId,
          invitation: response.data.invitation,
        });
        setActiveTab("invitations");
        setInvitationTab("sent");
        setSearchTerm("");
        setSearchResults([]);
        alert("✅ Invitation envoyée avec succès !");
      } catch (error) {
        console.error("Erreur envoi invitation:", error);
        alert(
          error.response?.data?.error ||
            "Erreur lors de l'envoi de l'invitation",
        );
      } finally {
        setInvitationsLoading(false);
      }
    },
    [setActiveTab, setSearchResults, setSearchTerm],
  );

  const handleAcceptInvitation = useCallback(
    async (invitationId) => {
      try {
        setInvitationsLoading(true);
        const response = await acceptInvitation(invitationId);
        const { invitation, conversation } = response.data || {};

        if (!invitation || invitation.status !== "accepted") {
          throw new Error("Invitation non valide");
        }

        setReceivedInvitations((prev) =>
          prev.filter((inv) => inv._id !== invitationId),
        );

        if (conversation) {
          updateConversations((prev) => {
            const exists = prev.some((conv) => conv._id === conversation._id);
            return exists ? prev : [conversation, ...prev];
          });
        }

        if (invitation && conversation) {
          emitInvitationAccepted({
            senderId: invitation.sender._id,
            invitation,
            conversation,
          });
        }

        setTimeout(() => {
          fetchConversations();
        }, 500);
        setActiveTab("chats");
        if (conversation?._id) {
          router.push(`/chat/${conversation._id}`);
        }
        alert("✅ Invitation acceptée avec succès !");
      } catch (error) {
        console.error("Erreur acceptation invitation:", error);
        if (error.response?.status === 409) {
          alert("Cette invitation a déjà été acceptée ou n'est plus valable.");
          await fetchInvitations();
          await fetchConversations();
        } else {
          alert(
            error.response?.data?.error ||
              error.message ||
              "Erreur lors de l'acceptation de l'invitation",
          );
        }
      } finally {
        setInvitationsLoading(false);
      }
    },
    [
      fetchConversations,
      fetchInvitations,
      router,
      setActiveTab,
      updateConversations,
    ],
  );

  const handleRejectInvitation = useCallback(async (invitationId, senderId) => {
    try {
      const response = await rejectInvitation(invitationId);
      setReceivedInvitations((prev) =>
        prev.filter((inv) => inv._id !== invitationId),
      );
      emitInvitationRejected({
        senderId,
        invitation: response.data.invitation,
      });
    } catch (error) {
      console.error("Erreur refus invitation:", error);
      alert("Erreur lors du refus de l'invitation");
    }
  }, []);

  const handleCancelInvitation = useCallback(
    async (invitationId, receiverId) => {
      try {
        await cancelInvitation(invitationId);
        setSentInvitations((prev) =>
          prev.filter((inv) => inv._id !== invitationId),
        );
        emitInvitationCancelled({
          receiverId,
          invitationId,
        });
      } catch (error) {
        console.error("Erreur annulation invitation:", error);
        alert("Erreur lors de l'annulation de l'invitation");
      }
    },
    [],
  );

  return {
    invitationsLoading,
    receivedInvitations,
    sentInvitations,
    invitationTab,
    setInvitationTab,
    fetchInvitations,
    handleSendInvitation,
    handleAcceptInvitation,
    handleRejectInvitation,
    handleCancelInvitation,
  };
}
