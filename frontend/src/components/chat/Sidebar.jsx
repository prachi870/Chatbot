import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';

const NAV_ITEMS = [
  { icon: '⚡', label: 'Chat',      path: '/'          },
  { icon: '📊', label: 'Dashboard', path: '/dashboard' },
  { icon: '⚙️', label: 'Settings',  path: '/settings'  },
];

function ChatItem({ chat, isActive, onSelect, onRename, onDelete }) {
  const [editing, setEditing]   = useState(false);
  const [title, setTitle]       = useState(chat.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef(null);
  const menuRef  = useRef(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);
  useEffect(() => {
    if (!menuOpen) return;
    const h = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menuOpen]);

  function startEdit(e) { e.stopPropagation(); setTitle(chat.title); setEditing(true); setMenuOpen(false); }
  function commitRename() {
    const t = title.trim();
    if (t && t !== chat.title) onRename(chat._id, t);
    setEditing(false);
  }
  function handleKeyDown(e) {
    if (e.key === 'Enter')  commitRename();
    if (e.key === 'Escape') { setTitle(chat.title); setEditing(false); }
  }
  function handleDelete(e) {
    e.stopPropagation(); setMenuOpen(false);
    if (window.confirm(`Delete "${chat.title}"?`)) onDelete(chat._id);
  }

  return (
    <li
      className={`chat-item${isActive ? ' chat-item--active' : ''}`}
      onClick={() => !editing && onSelect(chat._id)}
      role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && !editing && onSelect(chat._id)}
      aria-current={isActive ? 'page' : undefined}
    >
      {editing ? (
        <input ref={inputRef} className="chat-item__rename-input"
          value={title} onChange={(e) => setTitle(e.target.value)}
          onBlur={commitRename} onKeyDown={handleKeyDown} maxLength={100}
          onClick={(e) => e.stopPropagation()} aria-label="Rename chat" />
      ) : (
        <>
          <span className="chat-item__dot" aria-hidden="true" />
          <span className="chat-item__title">{chat.title}</span>
          <div className="chat-item__menu" ref={menuRef}>
            <button className="chat-item__menu-btn"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o); }}
              aria-label="Chat options" aria-expanded={menuOpen}>⋯</button>
            {menuOpen && (
              <ul className="chat-item__dropdown" role="menu">
                <li role="menuitem"><button onClick={startEdit}>✏️ Rename</button></li>
                <li role="menuitem"><button className="danger" onClick={handleDelete}>🗑️ Delete</button></li>
              </ul>
            )}
          </div>
        </>
      )}
    </li>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout }    = useAuth();
  const { chats, activeChatId, loadingChats, createChat, selectChat, renameChat, deleteChat } = useChat();
  const navigate            = useNavigate();
  const location            = useLocation();

  const totalChats    = chats.length;
  const usagePct      = Math.min(100, Math.round((totalChats / 50) * 100));

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />}

      <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`} aria-label="Navigation">

        {/* ── Brand ─────────────────────────────────────── */}
        <div className="sidebar__header">
          <div className="sidebar__brand">
            <div className="sidebar__brand-orb" aria-hidden="true">
              <div className="orb-inner" />
            </div>
            <div>
              <div className="sidebar__brand-name">NEXUS AI</div>
              <div className="sidebar__brand-sub">Cosmic Intelligence</div>
            </div>
          </div>
          <button className="sidebar__close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* ── Nav ───────────────────────────────────────── */}
        <nav className="sidebar__main-nav" aria-label="Main navigation">
          {NAV_ITEMS.map(item => (
            <button
              key={item.path}
              className={`sidebar__nav-item${location.pathname === item.path ? ' sidebar__nav-item--active' : ''}`}
              onClick={() => { navigate(item.path); onClose(); }}
            >
              <span className="sidebar__nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {location.pathname === item.path && <span className="sidebar__nav-pip" aria-hidden="true" />}
            </button>
          ))}
        </nav>

        {/* ── New chat ──────────────────────────────────── */}
        <button className="sidebar__new-btn" onClick={() => { createChat(); onClose(); }}>
          <span className="sidebar__new-btn-icon">＋</span>
          <span>New Conversation</span>
        </button>

        {/* ── Chat list ─────────────────────────────────── */}
        <div className="sidebar__section-label">Recent Conversations</div>
        <nav className="sidebar__nav" aria-label="Conversations">
          {loadingChats ? (
            <div className="sidebar__loading">
              <div className="sidebar__loading-dots"><span/><span/><span/></div>
              Scanning neural network…
            </div>
          ) : chats.length === 0 ? (
            <div className="sidebar__empty">
              <div className="sidebar__empty-icon">🌌</div>
              No conversations yet.<br/>Start your cosmic journey!
            </div>
          ) : (
            <ul className="chat-list" role="list">
              {chats.map(chat => (
                <ChatItem key={chat._id} chat={chat}
                  isActive={chat._id === activeChatId}
                  onSelect={selectChat} onRename={renameChat} onDelete={deleteChat} />
              ))}
            </ul>
          )}
        </nav>

        {/* ── Usage meter ───────────────────────────────── */}
        <div className="sidebar__usage">
          <div className="sidebar__usage-header">
            <span>Storage</span>
            <span className="sidebar__usage-pct">{usagePct}%</span>
          </div>
          <div className="sidebar__usage-bar">
            <div className="sidebar__usage-fill" style={{ width: `${usagePct}%` }} />
          </div>
          <div className="sidebar__usage-label">{totalChats} / 50 conversations</div>
        </div>

        {/* ── User footer ───────────────────────────────── */}
        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">
              {user?.name?.[0]?.toUpperCase() ?? '?'}
              <div className="sidebar__avatar-ring" aria-hidden="true" />
            </div>
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{user?.name}</span>
              <span className="sidebar__user-status">
                <span className="status-dot" aria-hidden="true"/>Online
              </span>
            </div>
          </div>
          <button className="sidebar__logout-btn" onClick={logout} title="Sign out" aria-label="Sign out">
            <span>⎋</span>
          </button>
        </div>
      </aside>
    </>
  );
}
