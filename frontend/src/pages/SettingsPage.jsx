import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function SettingsSection({ title, icon, children }) {
  return (
    <div className="settings-section">
      <div className="settings-section__header">
        <span className="settings-section__icon">{icon}</span>
        <h2 className="settings-section__title">{title}</h2>
      </div>
      <div className="settings-section__body">{children}</div>
    </div>
  );
}

function SettingsRow({ label, description, children }) {
  return (
    <div className="settings-row">
      <div className="settings-row__info">
        <span className="settings-row__label">{label}</span>
        {description && <span className="settings-row__desc">{description}</span>}
      </div>
      <div className="settings-row__control">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`toggle${checked ? ' toggle--on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle__thumb" />
    </button>
  );
}

export default function SettingsPage() {
  const { user, logout } = useAuth();

  // UI preferences (local only — no backend persistence needed)
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [soundEnabled,     setSoundEnabled]     = useState(false);
  const [compactMode,      setCompactMode]      = useState(false);
  const [codeLineNumbers,  setCodeLineNumbers]  = useState(true);
  const [enterToSend,      setEnterToSend]      = useState(true);
  const [showTimestamps,   setShowTimestamps]   = useState(false);

  const [copied, setCopied] = useState(false);

  function copyEmail() {
    navigator.clipboard.writeText(user?.email ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="settings-page">
      <div className="settings-hero">
        <div className="settings-hero__icon">⚙️</div>
        <div>
          <h1 className="settings-hero__title">Settings</h1>
          <p className="settings-hero__sub">Customize your NEXUS AI experience</p>
        </div>
      </div>

      <div className="settings-grid">

        {/* ── Profile ──────────────────────────────────── */}
        <SettingsSection title="Profile" icon="👤">
          <div className="profile-card">
            <div className="profile-card__avatar">
              {user?.name?.[0]?.toUpperCase() ?? '?'}
              <div className="profile-card__avatar-ring" aria-hidden="true" />
            </div>
            <div className="profile-card__info">
              <div className="profile-card__name">{user?.name}</div>
              <div className="profile-card__email">
                {user?.email}
                <button className="profile-card__copy" onClick={copyEmail} aria-label="Copy email">
                  {copied ? '✓ Copied' : '⧉ Copy'}
                </button>
              </div>
              <div className="profile-card__badge">
                <span className="status-dot" aria-hidden="true" />
                Active Account
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* ── Chat preferences ─────────────────────────── */}
        <SettingsSection title="Chat" icon="💬">
          <SettingsRow
            label="Streaming responses"
            description="Show AI response word by word as it's generated"
          >
            <Toggle checked={streamingEnabled} onChange={setStreamingEnabled} label="Toggle streaming" />
          </SettingsRow>
          <SettingsRow
            label="Enter to send"
            description="Press Enter to send · Shift+Enter for new line"
          >
            <Toggle checked={enterToSend} onChange={setEnterToSend} label="Toggle enter to send" />
          </SettingsRow>
          <SettingsRow
            label="Show timestamps"
            description="Display time on each message"
          >
            <Toggle checked={showTimestamps} onChange={setShowTimestamps} label="Toggle timestamps" />
          </SettingsRow>
          <SettingsRow
            label="Sound effects"
            description="Play subtle sounds on message send/receive"
          >
            <Toggle checked={soundEnabled} onChange={setSoundEnabled} label="Toggle sounds" />
          </SettingsRow>
        </SettingsSection>

        {/* ── Appearance ───────────────────────────────── */}
        <SettingsSection title="Appearance" icon="🎨">
          <SettingsRow
            label="Compact message mode"
            description="Reduce spacing between messages"
          >
            <Toggle checked={compactMode} onChange={setCompactMode} label="Toggle compact mode" />
          </SettingsRow>
          <SettingsRow
            label="Code line numbers"
            description="Show line numbers in code blocks"
          >
            <Toggle checked={codeLineNumbers} onChange={setCodeLineNumbers} label="Toggle line numbers" />
          </SettingsRow>
          <SettingsRow label="Theme" description="Current theme">
            <div className="settings-theme-badge">
              <span>🌌</span> Cosmic Dark
            </div>
          </SettingsRow>
        </SettingsSection>

        {/* ── AI Model ─────────────────────────────────── */}
        <SettingsSection title="AI Model" icon="🤖">
          <SettingsRow label="Current model" description="Powered by Google Gemini">
            <div className="settings-model-badge">
              <span className="status-dot" style={{ background: '#34d399', boxShadow: '0 0 6px #34d399' }} aria-hidden="true" />
              Gemini 3.6 Flash
            </div>
          </SettingsRow>
          <SettingsRow label="Context window" description="Messages sent as history">
            <div className="settings-value-badge">10 messages</div>
          </SettingsRow>
          <SettingsRow label="Response format" description="How AI formats replies">
            <div className="settings-value-badge">Markdown</div>
          </SettingsRow>
        </SettingsSection>

        {/* ── About ────────────────────────────────────── */}
        <SettingsSection title="About" icon="🌌">
          <SettingsRow label="Version" description="Current build">
            <div className="settings-value-badge">v1.0.0</div>
          </SettingsRow>
          <SettingsRow label="Stack" description="Built with">
            <div className="settings-stack">
              {['React', 'Vite', 'Express', 'MongoDB', 'Gemini'].map(s => (
                <span key={s} className="settings-tag">{s}</span>
              ))}
            </div>
          </SettingsRow>
        </SettingsSection>

        {/* ── Danger zone ──────────────────────────────── */}
        <SettingsSection title="Account" icon="⚠️">
          <SettingsRow label="Sign out" description="Sign out of your account on this device">
            <button className="btn btn-danger" onClick={logout}>
              ⎋ Sign Out
            </button>
          </SettingsRow>
        </SettingsSection>

      </div>
    </div>
  );
}
