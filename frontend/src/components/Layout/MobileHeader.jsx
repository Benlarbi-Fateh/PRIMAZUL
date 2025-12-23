"use client";

import ChatHeader from "./ChatHeader"; // adapte le chemin si besoin

// Même props que ChatHeader :
// { contact, conversation, onBack, onSearchOpen, onVideoCall, onAudioCall }
export default function MobileHeader(props) {
  return (
    <div className="lg:hidden">
      <ChatHeader {...props} />
    </div>
  );
}