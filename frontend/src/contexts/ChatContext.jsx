import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import * as chatsApi from '../api/chats';
import { streamMessage } from '../api/messages';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { user } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [chats, setChats]               = useState([]);   // sidebar list
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages]         = useState([]);   // messages for active chat
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [streaming, setStreaming]       = useState(false); // AI is typing
  const [error, setError]               = useState('');

  // Ref to the current abort function returned by streamMessage()
  const abortStreamRef = useRef(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  /** Replace or insert a chat in the sidebar list (move to top on update). */
  function upsertChat(chat) {
    setChats((prev) => {
      const filtered = prev.filter((c) => c._id !== chat._id);
      return [chat, ...filtered];
    });
  }

  // ── Load chat list ─────────────────────────────────────────────────────────
  const loadChats = useCallback(async () => {
    setLoadingChats(true);
    setError('');
    try {
      const { chats } = await chatsApi.listChats();
      setChats(chats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingChats(false);
    }
  }, []);

  // Load list whenever the user changes (login / logout)
  useEffect(() => {
    if (user) {
      loadChats();
    } else {
      setChats([]);
      setActiveChatId(null);
      setMessages([]);
    }
  }, [user, loadChats]);

  // ── Select a chat ──────────────────────────────────────────────────────────
  const selectChat = useCallback(async (chatId) => {
    if (chatId === activeChatId) return;

    // Abort any in-flight stream before switching
    if (abortStreamRef.current) {
      abortStreamRef.current();
      abortStreamRef.current = null;
      setStreaming(false);
    }

    setActiveChatId(chatId);
    setMessages([]);
    setError('');

    if (!chatId) return;

    setLoadingMessages(true);
    try {
      const { messages } = await chatsApi.getChat(chatId);
      setMessages(messages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMessages(false);
    }
  }, [activeChatId]);

  // ── Create a new chat ──────────────────────────────────────────────────────
  const createChat = useCallback(async (title) => {
    const { chat } = await chatsApi.createChat(title);
    upsertChat(chat);
    setMessages([]);
    setActiveChatId(chat._id);
    return chat;
  }, []);

  // ── Rename ─────────────────────────────────────────────────────────────────
  const renameChat = useCallback(async (chatId, title) => {
    const { chat } = await chatsApi.renameChat(chatId, title);
    upsertChat(chat);
  }, []);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const deleteChat = useCallback(async (chatId) => {
    await chatsApi.deleteChat(chatId);
    setChats((prev) => prev.filter((c) => c._id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId(null);
      setMessages([]);
    }
  }, [activeChatId]);

  // ── Send a message (streaming) ─────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text, file = null) => {
      if (!activeChatId || streaming) return;

      const trimmed = text.trim();
      if (!trimmed && !file) return;

      setError('');

      // Build display content for the optimistic user bubble
      const displayContent = trimmed || (file ? `📎 ${file.name}` : '');

      // 1. Optimistically add the user message
      const userMsg = {
        _id: `optimistic-${Date.now()}`,
        role: 'user',
        content: displayContent,
        createdAt: new Date().toISOString(),
        file: file ? { name: file.name, type: file.type, url: URL.createObjectURL(file) } : null,
      };
      setMessages((prev) => [...prev, userMsg]);

      // 2. Add an empty assistant placeholder
      const assistantMsgId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { _id: assistantMsgId, role: 'assistant', content: '', createdAt: new Date().toISOString() },
      ]);

      setStreaming(true);

      // 3. Stream
      abortStreamRef.current = streamMessage(
        activeChatId,
        trimmed,
        file,
        // onChunk
        (chunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m._id === assistantMsgId ? { ...m, content: m.content + chunk } : m
            )
          );
        },
        // onDone
        async () => {
          setStreaming(false);
          abortStreamRef.current = null;
          try {
            const { chat } = await chatsApi.getChat(activeChatId);
            upsertChat(chat);
          } catch { /* non-critical */ }
        },
        // onError
        (msg) => {
          setStreaming(false);
          abortStreamRef.current = null;
          setError(msg);
          setMessages((prev) => prev.filter((m) => m._id !== assistantMsgId));
        }
      );
    },
    [activeChatId, streaming]
  );

  // ── Stop streaming ─────────────────────────────────────────────────────────
  const stopStreaming = useCallback(() => {
    if (abortStreamRef.current) {
      abortStreamRef.current();
      abortStreamRef.current = null;
      setStreaming(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => () => abortStreamRef.current?.(), []);

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChatId,
        messages,
        loadingChats,
        loadingMessages,
        streaming,
        error,
        setError,
        loadChats,
        selectChat,
        createChat,
        renameChat,
        deleteChat,
        sendMessage,
        stopStreaming,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside <ChatProvider>');
  return ctx;
}
