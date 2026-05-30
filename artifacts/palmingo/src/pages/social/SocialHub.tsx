import { useLocation, useRoute } from "wouter";
import { ReactNode } from "react";
import Chats from "./Chats";
import DMConversation from "./DMConversation";
import Feed from "./Feed";
import VoiceRooms from "./VoiceRooms";
import SearchPeople from "./SearchPeople";

const TABS = [
  { id: "chats",  path: "/social/chats",  icon: "💬", label: "Chats" },
  { id: "rooms",  path: "/social/rooms",  icon: "🎙️",  label: "Rooms" },
  { id: "search", path: "/social/search", icon: "🔍", label: "Search" },
  { id: "feed",   path: "/social/feed",   icon: "📰", label: "Feed" },
] as const;

export default function SocialHub() {
  const [location, navigate] = useLocation();
  const [, dmParams] = useRoute("/social/chats/:friendId");

  const activeTab = TABS.find(t => location.startsWith(t.path))?.id ?? "feed";

  function renderPage() {
    if (dmParams?.friendId) return <DMConversation friendId={dmParams.friendId} />;
    if (location.startsWith("/social/chats"))  return <Chats />;
    if (location.startsWith("/social/rooms"))  return <VoiceRooms />;
    if (location.startsWith("/social/search")) return <SearchPeople />;
    return <Feed />;
  }

  return (
    <div className="flex flex-col" style={{ height: "100%", position: "relative" }}>
      {/* Content area */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 72 }}>
        {renderPage()}
      </div>

      {/* Bottom Tab Bar */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-stretch"
        style={{
          height: 64,
          background: "var(--background, white)",
          borderTop: "1px solid var(--border, rgba(0,0,0,0.08))",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          zIndex: 40,
        }}
      >
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 focus:outline-none"
              style={{ border: "none", background: "transparent" }}
            >
              {/* Active indicator pill */}
              <div
                className="absolute"
                style={{
                  top: 0,
                  width: isActive ? 28 : 0,
                  height: 3,
                  borderRadius: "0 0 3px 3px",
                  background: isActive ? "var(--brand-orange, #ff6b35)" : "transparent",
                  transition: "width 0.25s cubic-bezier(.4,0,.2,1)",
                }}
              />
              <span
                className="text-xl leading-none transition-transform duration-200"
                style={{ transform: isActive ? "scale(1.1)" : "scale(1)" }}
              >
                {tab.icon}
              </span>
              <span
                className="text-[11px] font-medium transition-colors duration-200"
                style={{ color: isActive ? "var(--brand-orange, #ff6b35)" : "var(--muted-foreground, #9ca3af)" }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
