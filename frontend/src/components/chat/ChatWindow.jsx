import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CosmicOrb from '../ui/CosmicOrb';
import { useChat } from '../../contexts/ChatContext';
import MessageInput from './MessageInput';

const SUGGESTIONS = [
  { icon: '🚀', text: 'Explain quantum computing' },
  { icon: '💡', text: 'Write a Python web scraper' },
  { icon: '🎨', text: 'Design a REST API structure' },
  { icon: '🌌', text: 'How does dark matter work?' },
  { icon: '⚡', text: 'Optimize my React app' },
  { icon: '🤖', text: 'Build a neural network from scratch' },
];

// ── Message bubble ──────────────────────────────────────────────────────────
function MessageBubble({ message }) {
  const isUser  = message.role === 'user';
  const isEmpty = !message.content && !isUser;

  return (
    <div className={`message message--${isUser ? 'user' : 'assistant'}`}>
      <div className={`message__avatar${isUser ? ' message__avatar--user' : ''}`} aria-hidden="true">
        {isUser ? (
          <span>👤</span>
        ) : (
          <div className="message__avatar-orb">
            <div className="orb-inner orb-inner--sm" />
          </div>
        )}
      </div>

      <div className="message__body">
        <span className="message__role">{isUser ? 'You' : 'NEXUS AI'}</span>
        <div className="message__content">
          {isEmpty ? (
            <span className="typing-indicator" aria-label="AI is typing">
              <span /><span /><span />
            </span>
          ) : isUser ? (
            <>
              {/* File attachment preview in bubble */}
              {message.file && (
                <div className="message__attachment">
                  {message.file.type?.startsWith('image/') ? (
                    <img src={message.file.url} alt={message.file.name} className="message__attachment-img" />
                  ) : (
                    <div className="message__attachment-file">
                      <span className="message__attachment-icon">
                        {message.file.type?.startsWith('video/') ? '🎬' :
                         message.file.type?.startsWith('audio/') ? '🎵' :
                         message.file.type === 'application/pdf' ? '📄' : '📎'}
                      </span>
                      <span>{message.file.name}</span>
                    </div>
                  )}
                </div>
              )}
              {message.content && <p className="message__text">{message.content}</p>}
            </>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ node, ...p }) => <a {...p} target="_blank" rel="noopener noreferrer" />,
                code: ({ node, inline, className, children, ...p }) => {
                  if (inline) return <code className="md-inline-code" {...p}>{children}</code>;
                  return (
                    <div className="md-code-block">
                      <div className="md-code-block-header">
                        <span>{(className || '').replace('language-', '') || 'code'}</span>
                        <button className="md-code-copy"
                          onClick={() => navigator.clipboard.writeText(String(children))}>
                          Copy
                        </button>
                      </div>
                      <pre><code className={className} {...p}>{children}</code></pre>
                    </div>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Welcome / Empty state ───────────────────────────────────────────────────
function WelcomeState({ user }) {
  const { createChat, sendMessage, activeChatId } = useChat();

  async function handleSuggestion(text) {
    let id = activeChatId;
    if (!id) {
      const chat = await createChat();
      id = chat._id;
    }
    sendMessage(text);
  }

  const firstName = user?.name?.split(' ')[0] ?? 'Explorer';

  return (
    <div className="welcome-state">
      <div className="welcome-state__orb">
        <CosmicOrb size={130} />
      </div>
      <p className="welcome-state__greeting">Hi, {firstName} 👋</p>
      <h2 className="welcome-state__title">How can I help you today?</h2>
      <p className="welcome-state__sub">
        I'm here to help — from quick answers to deep cosmic knowledge.
      </p>

      <div className="suggestion-grid">
        {SUGGESTIONS.map((s) => (
          <button key={s.text} className="suggestion-card" onClick={() => handleSuggestion(s.text)}>
            <span className="suggestion-card__icon">{s.icon}</span>
            <span className="suggestion-card__text">{s.text}</span>
            <span className="suggestion-card__arrow">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Chat window ─────────────────────────────────────────────────────────────
export default function ChatWindow({ onOpenSidebar }) {
  const { activeChatId, messages, loadingMessages, streaming, error, setError, chats } = useChat();
  const { user } = { user: null }; // will be passed as prop or from context
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const activeChat = chats.find(c => c._id === activeChatId);

  return (
    <div className="chat-window">
      {/* Header */}
      <header className="chat-header">
        <button className="chat-header__menu-btn" onClick={onOpenSidebar} aria-label="Open sidebar">
          <span className="hamburger-icon">
            <span/><span/><span/>
          </span>
        </button>

        <div className="chat-header__center">
          {activeChat ? (
            <>
              <div className="chat-header__active-dot" aria-hidden="true" />
              <span className="chat-header__title">{activeChat.title}</span>
            </>
          ) : (
            <span className="chat-header__title">NEXUS AI</span>
          )}
        </div>

        <div className="chat-header__right">
          <div className="chat-header__badge">
            <span className="badge-pulse" aria-hidden="true"/>
            Gemini · Online
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="chat-messages" aria-label="Conversation">
        {!activeChatId && !loadingMessages ? (
          <WelcomeState user={null} />
        ) : loadingMessages ? (
          <div className="chat-loading">
            <CosmicOrb size={60} />
            <p>Loading conversation…</p>
          </div>
        ) : messages.length === 0 ? (
          <WelcomeState user={null} />
        ) : (
          messages.map(msg => <MessageBubble key={msg._id} message={msg} />)
        )}

        {error && (
          <div className="chat-error" role="alert">
            <span>⚠️ {error}</span>
            <button className="chat-error__dismiss" onClick={() => setError('')}>✕</button>
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      <MessageInput />
    </div>
  );
}
