import { useEffect, useRef, useState } from 'react';
import { useChat } from '../../contexts/ChatContext';

const MAX_CHARS = 8000;

const ACCEPTED_FILES = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'text/plain',
  'text/csv',
].join(',');

// ── File type helpers ────────────────────────────────────────────────────────
function getFileIcon(type) {
  if (type.startsWith('image/'))       return '🖼️';
  if (type.startsWith('video/'))       return '🎬';
  if (type.startsWith('audio/'))       return '🎵';
  if (type === 'application/pdf')      return '📄';
  return '📎';
}

function formatBytes(bytes) {
  if (bytes < 1024)         return `${bytes} B`;
  if (bytes < 1024 * 1024)  return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Voice hook ───────────────────────────────────────────────────────────────
function useVoice(onTranscript) {
  const [listening, setListening]   = useState(false);
  const [supported, setSupported]   = useState(false);
  const recognitionRef              = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      setSupported(true);
      const rec = new SR();
      rec.continuous      = false;
      rec.interimResults  = true;
      rec.lang            = 'en-US';

      rec.onresult = (e) => {
        const transcript = Array.from(e.results)
          .map((r) => r[0].transcript)
          .join('');
        onTranscript(transcript, e.results[e.results.length - 1].isFinal);
      };

      rec.onend  = () => setListening(false);
      rec.onerror = () => setListening(false);

      recognitionRef.current = rec;
    }
  }, []); // eslint-disable-line

  function toggle() {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  }

  return { listening, supported, toggle };
}

// ── FilePreview ──────────────────────────────────────────────────────────────
function FilePreview({ file, onRemove }) {
  const isImage = file.type.startsWith('image/');
  const [previewUrl] = useState(() => isImage ? URL.createObjectURL(file) : null);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  return (
    <div className="file-preview">
      {isImage ? (
        <img src={previewUrl} alt={file.name} className="file-preview__img" />
      ) : (
        <div className="file-preview__icon">{getFileIcon(file.type)}</div>
      )}
      <div className="file-preview__info">
        <span className="file-preview__name">{file.name}</span>
        <span className="file-preview__size">{formatBytes(file.size)}</span>
      </div>
      <button
        className="file-preview__remove"
        onClick={onRemove}
        aria-label="Remove file"
        type="button"
      >
        ✕
      </button>
    </div>
  );
}

// ── Main MessageInput ────────────────────────────────────────────────────────
export default function MessageInput() {
  const { activeChatId, streaming, sendMessage, stopStreaming, createChat } = useChat();

  const [text, setText]       = useState('');
  const [file, setFile]       = useState(null);
  const [sending, setSending] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [text]);

  // Re-focus after send
  useEffect(() => {
    if (!streaming && !sending) textareaRef.current?.focus();
  }, [streaming, sending]);

  // Voice — interim transcript fills textarea; final transcript stays
  const { listening, supported: voiceSupported, toggle: toggleVoice } = useVoice(
    (transcript, isFinal) => {
      setText(transcript);
      if (isFinal) textareaRef.current?.focus();
    }
  );

  async function handleSend() {
    const trimmed = text.trim();
    if ((!trimmed && !file) || sending) return;

    let chatId = activeChatId;
    if (!chatId) {
      setSending(true);
      try { const chat = await createChat(); chatId = chat._id; }
      catch { setSending(false); return; }
      setSending(false);
    }

    const fileToSend = file;
    setText('');
    setFile(null);
    await sendMessage(trimmed, fileToSend);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (streaming) return;
      handleSend();
    }
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
    e.target.value = ''; // reset so same file can be re-selected
  }

  // Drag & drop
  function handleDragOver(e)  { e.preventDefault(); setDragOver(true); }
  function handleDragLeave()  { setDragOver(false); }
  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  }

  const charsLeft   = MAX_CHARS - text.length;
  const isOverLimit = charsLeft < 0;
  const canSend     = (text.trim().length > 0 || !!file) && !isOverLimit && !sending;

  return (
    <div
      className={`message-input-wrapper${dragOver ? ' message-input-wrapper--dragover' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag-over overlay */}
      {dragOver && (
        <div className="drop-overlay" aria-hidden="true">
          <span>📎 Drop file to attach</span>
        </div>
      )}

      {/* File preview */}
      {file && <FilePreview file={file} onRemove={() => setFile(null)} />}

      {/* Char counter */}
      {text.length > MAX_CHARS * 0.8 && (
        <div className={`char-counter${isOverLimit ? ' char-counter--over' : ''}`} aria-live="polite">
          {isOverLimit ? `${Math.abs(charsLeft)} over limit` : `${charsLeft} remaining`}
        </div>
      )}

      {/* Voice listening indicator */}
      {listening && (
        <div className="voice-listening" aria-live="polite">
          <span className="voice-listening__dot" aria-hidden="true" />
          <span className="voice-listening__dot" aria-hidden="true" />
          <span className="voice-listening__dot" aria-hidden="true" />
          Listening…
        </div>
      )}

      <div className={`message-input${isOverLimit ? ' message-input--over' : ''}${dragOver ? ' message-input--dragover' : ''}`}>
        {/* Left actions */}
        <div className="message-input__left">
          {/* File attach button */}
          <button
            type="button"
            className="input-action-btn"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach file"
            title="Attach file (image, PDF, video, audio)"
            disabled={sending || streaming}
          >
            📎
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FILES}
            onChange={handleFileChange}
            className="visually-hidden"
            aria-hidden="true"
          />

          {/* Voice button */}
          {voiceSupported && (
            <button
              type="button"
              className={`input-action-btn${listening ? ' input-action-btn--listening' : ''}`}
              onClick={toggleVoice}
              aria-label={listening ? 'Stop listening' : 'Start voice input'}
              title={listening ? 'Stop recording' : 'Voice input'}
              disabled={sending || streaming}
            >
              {listening ? '🔴' : '🎙️'}
            </button>
          )}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          className="message-input__textarea"
          placeholder={file ? 'Add a message about this file… (optional)' : 'Message AI… (Shift+Enter for newline)'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          rows={1}
          maxLength={MAX_CHARS + 100}
          aria-label="Message input"
          aria-describedby="char-hint"
        />

        {/* Right: stop or send */}
        {streaming ? (
          <button className="btn btn-stop" onClick={stopStreaming} aria-label="Stop generating" title="Stop">
            <span className="stop-icon" aria-hidden="true">■</span>
          </button>
        ) : (
          <button className="btn btn-send" onClick={handleSend} disabled={!canSend} aria-label="Send" title="Send">
            <span aria-hidden="true">▲</span>
          </button>
        )}
      </div>

      <p id="char-hint" className="visually-hidden">
        Maximum {MAX_CHARS} characters. Press Enter to send, Shift+Enter for new line.
      </p>
      <p className="input-hint" aria-hidden="true">
        Enter to send · Shift+Enter for new line · drag & drop files
      </p>
    </div>
  );
}
