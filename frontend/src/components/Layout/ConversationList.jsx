"use client";

import Image from "next/image";
import {
  Archive,
  MessageCircle,
  MoreVertical,
  Plus,
  Shield,
  Trash2,
  Users,
} from "lucide-react";

export default function ConversationList({
  activeConversationId,
  buttonStyle,
  checkContactHasStatus,
  checkContactHasUnviewedStatus,
  conversationCard,
  emptyStateBg,
  formatMessageTime,
  getDisplayImage,
  getDisplayName,
  getLastMessagePreview,
  getMessageStatus,
  getOtherParticipant,
  handleArchiveConversation,
  handleBlockConversationContact,
  handleClearConversation,
  isAllMode,
  isDark,
  isUserOnline,
  markStatusAsViewed,
  menuOpen,
  renderStatusIcon,
  router,
  setMenuOpen,
  textPrimary,
  textSecondary,
  visibleConversations,
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        {visibleConversations.length === 0 ? (
          <EmptyConversationState
            buttonStyle={buttonStyle}
            emptyStateBg={emptyStateBg}
            isAllMode={isAllMode}
            isDark={isDark}
            router={router}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
          />
        ) : (
          <div className="p-3 space-y-2">
            {visibleConversations.map((conv) => (
              <ConversationItem
                key={conv._id}
                activeConversationId={activeConversationId}
                checkContactHasStatus={checkContactHasStatus}
                checkContactHasUnviewedStatus={checkContactHasUnviewedStatus}
                conversationCard={conversationCard}
                conv={conv}
                formatMessageTime={formatMessageTime}
                getDisplayImage={getDisplayImage}
                getDisplayName={getDisplayName}
                getLastMessagePreview={getLastMessagePreview}
                getMessageStatus={getMessageStatus}
                getOtherParticipant={getOtherParticipant}
                handleArchiveConversation={handleArchiveConversation}
                handleBlockConversationContact={handleBlockConversationContact}
                handleClearConversation={handleClearConversation}
                isDark={isDark}
                isUserOnline={isUserOnline}
                markStatusAsViewed={markStatusAsViewed}
                menuOpen={menuOpen}
                renderStatusIcon={renderStatusIcon}
                router={router}
                setMenuOpen={setMenuOpen}
              />
            ))}
          </div>
        )}
      </div>
      <button
        onClick={() => router.push("/group/create")}
        className={`fixed bottom-6 right-6 w-12 h-12 text-white rounded-full shadow-2xl transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center z-50 group ${isDark ? "bg-linear-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 hover:shadow-cyan-500/50" : "bg-linear-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:shadow-blue-500/50"}`}
        title="Creer un groupe"
      >
        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  );
}

function EmptyConversationState({
  buttonStyle,
  emptyStateBg,
  isAllMode,
  isDark,
  router,
  textPrimary,
  textSecondary,
}) {
  return (
    <div className="p-12 text-center animate-fade-in">
      <div
        className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg ${emptyStateBg}`}
      >
        <MessageCircle
          className={`w-12 h-12 ${isDark ? "text-cyan-400" : "text-blue-500"}`}
        />
      </div>
      <p className={`font-bold text-lg mb-2 ${textPrimary}`}>
        Aucune conversation
      </p>
      <p className={`text-sm mb-6 ${textSecondary}`}>
        Commencez a discuter avec vos contacts
      </p>
      {isAllMode && (
        <button
          onClick={() => router.push("/?tab=contacts&subtab=add")}
          className={`px-8 py-3 text-white rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl ${buttonStyle}`}
        >
          Rechercher des contacts
        </button>
      )}
    </div>
  );
}

function ConversationItem({
  activeConversationId,
  checkContactHasStatus,
  checkContactHasUnviewedStatus,
  conversationCard,
  conv,
  formatMessageTime,
  getDisplayImage,
  getDisplayName,
  getLastMessagePreview,
  getMessageStatus,
  getOtherParticipant,
  handleArchiveConversation,
  handleBlockConversationContact,
  handleClearConversation,
  isDark,
  isUserOnline,
  markStatusAsViewed,
  menuOpen,
  renderStatusIcon,
  router,
  setMenuOpen,
}) {
  const isActive = conv._id === activeConversationId;
  const messageStatus = getMessageStatus(conv);
  const lastMessageTime = formatMessageTime(conv.updatedAt);
  const unreadCount = conv.unreadCount || 0;
  const displayName = getDisplayName(conv);
  const displayImage = getDisplayImage(conv);
  const contact = getOtherParticipant(conv);
  const contactHasStatus = contact ? checkContactHasStatus(contact._id) : false;

  return (
    <div
      className="relative group animate-slide-in-left"
      onMouseLeave={() => setMenuOpen(null)}
    >
      <button
        onClick={() => router.push(`/chat/${conv._id}`)}
        className={`w-full p-4 rounded-2xl transition-all flex items-center gap-4 ${conversationCard(isActive, unreadCount > 0)}`}
      >
        <div className="relative shrink-0">
          {!conv.isGroup && contact && contactHasStatus && (
            <div
              className="absolute -inset-1 rounded-full border-3"
              style={{
                borderColor: checkContactHasUnviewedStatus(contact._id)
                  ? "#3b82f6"
                  : "#9ca3af",
              }}
            ></div>
          )}
          <div
            className={`relative w-13 h-13 rounded-full overflow-hidden cursor-pointer ${!conv.isGroup && contact && contactHasStatus ? "ring-2 ring-white dark:ring-slate-900" : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              if (!conv.isGroup && contact && contactHasStatus) {
                markStatusAsViewed(contact._id);
                router.push(`/status?open=${contact._id}`);
              }
            }}
          >
            <Image
              src={displayImage}
              alt={displayName}
              fill
              sizes="40px"
              loading="lazy"
              className="object-cover"
              onError={(event) => {
                event.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0ea5e9&color=fff&bold=true`;
              }}
            />
          </div>
          {!conv.isGroup && contact && !contactHasStatus && isUserOnline(contact._id) && (
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-cyan-500 border-2 border-blue-900 rounded-full shadow-md"></span>
          )}
          {conv.isGroup && (
            <span className="absolute bottom-0 right-0 w-6 h-6 bg-linear-to-br from-purple-500 to-pink-500 border-2 border-blue-900 rounded-full flex items-center justify-center shadow-md">
              <Users className="w-3 h-3 text-white" />
            </span>
          )}
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center justify-between mb-1 pr-8">
            <h3
              className={`font-bold truncate pr-2 ${isActive ? "text-white" : unreadCount > 0 ? (isDark ? "text-cyan-100" : "text-slate-800") : isDark ? "text-blue-200" : "text-slate-700"}`}
            >
              {displayName}
            </h3>
            {lastMessageTime && (
              <span
                className={`text-xs shrink-0 font-semibold ${isActive ? "text-white/90" : unreadCount > 0 ? (isDark ? "text-cyan-300" : "text-blue-600") : isDark ? "text-blue-300" : "text-slate-400"}`}
              >
                {lastMessageTime}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {messageStatus && renderStatusIcon(messageStatus)}
            <p
              className={`text-sm truncate ${isActive ? "text-white/90" : unreadCount > 0 ? (isDark ? "font-semibold text-blue-200" : "font-semibold text-slate-700") : isDark ? "text-blue-300" : "text-slate-500"}`}
            >
              {getLastMessagePreview(conv)}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <span className="shrink-0 text-white text-xs font-bold px-3 py-1.5 rounded-full min-w-6 text-center shadow-md bg-linear-to-r from-blue-500 to-cyan-500">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      <button
        onClick={(event) => {
          event.stopPropagation();
          setMenuOpen(menuOpen === conv._id ? null : conv._id);
        }}
        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all ${isDark ? "hover:bg-blue-800/50" : "hover:bg-blue-100"}`}
      >
        <MoreVertical
          className={`w-5 h-5 ${isDark ? "text-cyan-300" : "text-blue-500"}`}
        />
      </button>
      {menuOpen === conv._id && (
        <ConversationMenu
          conv={conv}
          handleArchiveConversation={handleArchiveConversation}
          handleBlockConversationContact={handleBlockConversationContact}
          handleClearConversation={handleClearConversation}
          isDark={isDark}
        />
      )}
    </div>
  );
}

function ConversationMenu({
  conv,
  handleArchiveConversation,
  handleBlockConversationContact,
  handleClearConversation,
  isDark,
}) {
  return (
    <div
      className={`absolute right-2 top-[120%] -translate-y-1/2 rounded-2xl shadow-2xl border-2 py-2 z-20 w-52 animate-scale-in ${isDark ? "bg-linear-to-r from-blue-900 to-blue-800 border-blue-700" : "bg-white border-blue-100"}`}
    >
      <button
        onClick={(event) => {
          event.stopPropagation();
          handleArchiveConversation(conv);
        }}
        className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 font-medium transition-colors ${isDark ? "hover:bg-blue-800/50 text-blue-200" : "hover:bg-blue-50 text-slate-700"}`}
      >
        <Archive
          className={`w-5 h-5 ${isDark ? "text-cyan-400" : "text-blue-500"}`}
        />
        Archiver
      </button>
      {!conv.isGroup && (
        <button
          onClick={(event) => {
            event.stopPropagation();
            handleBlockConversationContact(conv);
          }}
          className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 font-medium transition-colors ${isDark ? "hover:bg-red-900/40 text-red-300 hover:text-red-200" : "hover:bg-red-50 text-red-600 hover:text-red-700"}`}
        >
          <Shield className="w-5 h-5" />
          Bloquer le contact
        </button>
      )}
      <button
        onClick={(event) => {
          event.stopPropagation();
          handleClearConversation(conv);
        }}
        className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 font-medium transition-colors ${isDark ? "hover:bg-red-900/50 text-red-300 hover:text-red-200" : "hover:bg-red-50 text-red-600 hover:text-red-700"}`}
      >
        <Trash2 className="w-5 h-5" />
        Supprimer la discussion
      </button>
    </div>
  );
}
