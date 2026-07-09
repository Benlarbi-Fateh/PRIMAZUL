"use client";

import Image from "next/image";
import { Bell, Clock, Send, UserCheck, UserX, X } from "lucide-react";

export default function InvitationList({
  isDark,
  buttonStyle,
  emptyStateBg,
  textPrimary,
  textSecondary,
  invitationTab,
  setInvitationTab,
  invitationsLoading,
  receivedInvitations,
  sentInvitations,
  getFullUrl,
  isUserOnline,
  formatMessageTime,
  handleAcceptInvitation,
  handleRejectInvitation,
  handleCancelInvitation,
}) {
  return (
    <div className="animate-fade-in">
      <div
        className={`p-4 flex gap-2 sticky top-0 z-10 backdrop-blur-sm ${isDark ? "bg-linear-to-b from-blue-950/50 to-transparent" : "bg-linear-to-b from-blue-50/50 to-transparent"}`}
      >
        <button
          onClick={() => setInvitationTab("received")}
          className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all relative flex items-center justify-center gap-2 ${
            invitationTab === "received"
              ? `${buttonStyle} text-white shadow-lg transform scale-[1.02]`
              : `${
                  isDark
                    ? "bg-linear-to-r from-blue-900/80 to-blue-800/80 text-blue-200 hover:from-blue-800 hover:to-blue-900"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                } shadow-sm`
          }`}
        >
          <span>Re&ccedil;ues</span>
          {receivedInvitations.length > 0 && (
            <span className="min-w-[20px] h-[20px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1 shadow-md animate-bounce">
              {receivedInvitations.length > 99
                ? "99+"
                : receivedInvitations.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setInvitationTab("sent")}
          className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${invitationTab === "sent" ? `${buttonStyle} text-white shadow-lg transform scale-[1.02]` : `${isDark ? "bg-linear-to-r from-blue-900/80 to-blue-800/80 text-blue-200 hover:from-blue-800 hover:to-blue-900" : "bg-white text-slate-600 hover:bg-slate-50"} shadow-sm`}`}
        >
          Envoy&eacute;es{" "}
          {sentInvitations.length > 0 && `(${sentInvitations.length})`}
        </button>
      </div>

      {invitationsLoading ? (
        <div className="flex justify-center py-10">
          <div
            className={`animate-spin rounded-full h-10 w-10 border-4 ${isDark ? "border-blue-800/50 border-t-cyan-400" : "border-blue-100 border-t-blue-600"}`}
          ></div>
        </div>
      ) : invitationTab === "received" ? (
        <ReceivedInvitations
          isDark={isDark}
          emptyStateBg={emptyStateBg}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          invitations={receivedInvitations}
          getFullUrl={getFullUrl}
          isUserOnline={isUserOnline}
          formatMessageTime={formatMessageTime}
          onAccept={handleAcceptInvitation}
          onReject={handleRejectInvitation}
        />
      ) : (
        <SentInvitations
          isDark={isDark}
          emptyStateBg={emptyStateBg}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          invitations={sentInvitations}
          getFullUrl={getFullUrl}
          isUserOnline={isUserOnline}
          formatMessageTime={formatMessageTime}
          onCancel={handleCancelInvitation}
        />
      )}
    </div>
  );
}

function ReceivedInvitations({
  isDark,
  emptyStateBg,
  textPrimary,
  textSecondary,
  invitations,
  getFullUrl,
  isUserOnline,
  formatMessageTime,
  onAccept,
  onReject,
}) {
  if (invitations.length === 0) {
    return (
      <div className="p-12 text-center">
        <div
          className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 ${emptyStateBg}`}
        >
          <Bell
            className={`w-12 h-12 ${isDark ? "text-cyan-400" : "text-blue-500"}`}
          />
        </div>
        <p className={`font-bold text-lg mb-2 ${textPrimary}`}>
          Aucune invitation re&ccedil;ue
        </p>
        <p className={`text-sm ${textSecondary}`}>
          Les invitations appara&icirc;tront ici
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      {invitations.map((invitation) => (
        <div
          key={invitation._id}
          className={`p-5 rounded-2xl border-2 shadow-md hover:shadow-xl transition-all animate-slide-in-left ${isDark ? "bg-linear-to-r from-blue-900/80 to-blue-800/80 border-blue-800" : "bg-white border-blue-100"}`}
        >
          <InvitationPerson
            isDark={isDark}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
            person={invitation.sender}
            getFullUrl={getFullUrl}
            isUserOnline={isUserOnline}
            formatMessageTime={formatMessageTime}
            createdAt={invitation.createdAt}
          />
          <InvitationMessage isDark={isDark} message={invitation.message} />
          <div className="flex gap-2">
            <button
              onClick={() => onAccept(invitation._id)}
              className="flex-1 bg-linear-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
            >
              <UserCheck className="w-5 h-5" />
              Accepter
            </button>
            <button
              onClick={() => onReject(invitation._id, invitation.sender?._id)}
              className="flex-1 bg-linear-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
            >
              <UserX className="w-5 h-5" />
              Refuser
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function SentInvitations({
  isDark,
  emptyStateBg,
  textPrimary,
  textSecondary,
  invitations,
  getFullUrl,
  isUserOnline,
  formatMessageTime,
  onCancel,
}) {
  if (invitations.length === 0) {
    return (
      <div className="p-12 text-center">
        <div
          className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 ${emptyStateBg}`}
        >
          <Send
            className={`w-12 h-12 ${isDark ? "text-cyan-400" : "text-slate-400"}`}
          />
        </div>
        <p className={`font-bold text-lg mb-2 ${textPrimary}`}>
          Aucune invitation envoy&eacute;e
        </p>
        <p className={`text-sm ${textSecondary}`}>
          Envoyez des invitations depuis l&apos;onglet Contacts
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      {invitations.map((invitation) => (
        <div
          key={invitation._id}
          className={`p-5 rounded-2xl border-2 shadow-md hover:shadow-xl transition-all animate-slide-in-left ${isDark ? "bg-linear-to-r from-blue-900/80 to-blue-800/80 border-blue-800" : "bg-white border-blue-100"}`}
        >
          <InvitationPerson
            isDark={isDark}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
            person={invitation.receiver}
            getFullUrl={getFullUrl}
            isUserOnline={isUserOnline}
            formatMessageTime={formatMessageTime}
            createdAt={invitation.createdAt}
          />
          <InvitationMessage isDark={isDark} message={invitation.message} />
          <button
            onClick={() => onCancel(invitation._id, invitation.receiver?._id)}
            className="w-full bg-linear-to-r from-blue-800 to-blue-900 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
          >
            <X className="w-5 h-5" />
            Annuler l&apos;invitation
          </button>
        </div>
      ))}
    </div>
  );
}

function InvitationPerson({
  isDark,
  textPrimary,
  textSecondary,
  person,
  getFullUrl,
  isUserOnline,
  formatMessageTime,
  createdAt,
}) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="relative shrink-0">
        <div
          className={`w-14 h-14 rounded-full overflow-hidden ring-2 ${isDark ? "ring-blue-800" : "ring-blue-100"}`}
        >
          <Image
            src={
              getFullUrl(person?.profilePicture) ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(person?.name || "User")}&background=0ea5e9&color=fff&bold=true`
            }
            alt={person?.name || "User"}
            width={56}
            height={56}
            className="w-full h-full object-cover"
            unoptimized
          />
        </div>
        {isUserOnline(person?._id) && (
          <span className="absolute bottom-0 right-0 w-4 h-4 bg-cyan-500 border-2 border-blue-900 rounded-full"></span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={`font-bold truncate ${textPrimary}`}>{person?.name}</h3>
        <p className={`text-sm truncate ${textSecondary}`}>{person?.email}</p>
        <p
          className={`text-xs mt-1 flex items-center gap-1 font-medium ${isDark ? "text-cyan-400" : "text-blue-500"}`}
        >
          <Clock className="w-3 h-3" />
          {formatMessageTime(createdAt)}
        </p>
      </div>
    </div>
  );
}

function InvitationMessage({ isDark, message }) {
  if (!message) return null;

  return (
    <p
      className={`text-sm p-3 rounded-xl mb-4 ${isDark ? "text-blue-200 bg-blue-900/50" : "text-slate-700 bg-blue-50"}`}
    >
      {message}
    </p>
  );
}
