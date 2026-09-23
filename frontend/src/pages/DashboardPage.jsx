import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import CosmicOrb from '../components/ui/CosmicOrb';

// ── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className={`stat-card stat-card--${color} ${visible ? 'stat-card--visible' : ''}`}>
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__body">
        <div className="stat-card__value">{value}</div>
        <div className="stat-card__label">{label}</div>
        {sub && <div className="stat-card__sub">{sub}</div>}
      </div>
      <div className="stat-card__glow" aria-hidden="true" />
    </div>
  );
}

// ── Mini bar chart ──────────────────────────────────────────────────────────
function ActivityChart({ data }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="activity-chart">
      {data.map((d, i) => (
        <div key={i} className="activity-chart__bar-wrap">
          <div
            className="activity-chart__bar"
            style={{ height: `${(d.count / max) * 100}%`, animationDelay: `${i * 0.06}s` }}
            title={`${d.label}: ${d.count}`}
          />
          <span className="activity-chart__label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Build activity data from chats ──────────────────────────────────────────
function buildActivityData(chats) {
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const counts = new Array(7).fill(0);
  const now = new Date();
  chats.forEach(c => {
    const d = new Date(c.updatedAt);
    const diff = Math.floor((now - d) / 86400000);
    if (diff < 7) counts[6 - diff]++;
  });
  return counts.map((count, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return { label: days[d.getDay()], count };
  });
}

// ── Recent chat row ─────────────────────────────────────────────────────────
function ChatRow({ chat, index, onOpen }) {
  const date = new Date(chat.updatedAt);
  const timeStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return (
    <tr className="history-row" style={{ animationDelay: `${index * 0.05}s` }}>
      <td className="history-row__num">#{String(index + 1).padStart(2, '0')}</td>
      <td className="history-row__title">
        <div className="history-row__dot" aria-hidden="true" />
        <span>{chat.title}</span>
      </td>
      <td className="history-row__date">{timeStr}</td>
      <td>
        <span className={`history-badge history-badge--active`}>Active</span>
      </td>
      <td>
        <button className="history-row__open" onClick={() => onOpen(chat._id)}
          aria-label={`Open ${chat.title}`}>Open →</button>
      </td>
    </tr>
  );
}

// ── Dashboard ───────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user }          = useAuth();
  const { chats, selectChat, loadingChats } = useChat();
  const navigate          = useNavigate();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12)      setGreeting('Good morning');
    else if (h < 17) setGreeting('Good afternoon');
    else             setGreeting('Good evening');
  }, []);

  const firstName    = user?.name?.split(' ')[0] ?? 'Explorer';
  const totalChats   = chats.length;
  const todayChats   = chats.filter(c => {
    const d = new Date(c.updatedAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;
  const thisWeek     = chats.filter(c => {
    const d = new Date(c.updatedAt);
    return (new Date() - d) < 7 * 86400000;
  }).length;
  const activityData = buildActivityData(chats);
  const recentChats  = [...chats].slice(0, 10);

  function openChat(chatId) {
    selectChat(chatId);
    navigate('/');
  }

  return (
    <div className="dashboard">
      {/* ── Hero banner ─────────────────────────────────── */}
      <div className="dashboard__hero">
        <div className="dashboard__hero-text">
          <p className="dashboard__hero-greeting">{greeting}, {firstName} 👋</p>
          <h1 className="dashboard__hero-title">Welcome Back, <span className="gradient-text">Commander</span></h1>
          <p className="dashboard__hero-sub">
            Your cosmic intelligence hub — track activity, explore history, and launch new missions.
          </p>
          <button className="btn btn-primary dashboard__hero-cta" onClick={() => navigate('/')}>
            <span>⚡</span> Start New Chat
          </button>
        </div>
        <div className="dashboard__hero-orb">
          <CosmicOrb size={160} />
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────── */}
      <div className="stats-grid">
        <StatCard icon="💬" label="Total Conversations" value={totalChats}  sub="All time"   color="purple" delay={0}   />
        <StatCard icon="📅" label="Today's Sessions"    value={todayChats}  sub="Last 24h"   color="blue"   delay={80}  />
        <StatCard icon="📈" label="This Week"           value={thisWeek}    sub="Last 7 days" color="cyan"   delay={160} />
        <StatCard icon="🌌" label="AI Model"            value="Gemini"      sub="3.6 Flash"   color="violet" delay={240} />
      </div>

      {/* ── Activity chart + recent ─────────────────────── */}
      <div className="dashboard__grid">

        {/* Activity chart */}
        <div className="dash-card">
          <div className="dash-card__header">
            <h3 className="dash-card__title">📊 Weekly Activity</h3>
            <span className="dash-card__badge">{thisWeek} this week</span>
          </div>
          <div className="dash-card__body">
            {loadingChats ? (
              <div className="dash-loading">Loading…</div>
            ) : (
              <ActivityChart data={activityData} />
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="dash-card">
          <div className="dash-card__header">
            <h3 className="dash-card__title">⚡ Quick Launch</h3>
          </div>
          <div className="dash-card__body">
            <div className="quick-actions">
              {[
                { icon: '🚀', label: 'New Chat',       action: () => navigate('/') },
                { icon: '📖', label: 'View History',   action: () => document.getElementById('history')?.scrollIntoView({ behavior: 'smooth' }) },
                { icon: '🌌', label: 'Explore Topics', action: () => navigate('/') },
                { icon: '⚙️', label: 'Settings',       action: () => navigate('/settings') },
              ].map(q => (
                <button key={q.label} className="quick-action" onClick={q.action}>
                  <span className="quick-action__icon">{q.icon}</span>
                  <span className="quick-action__label">{q.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── Chat history table ───────────────────────────── */}
      <div className="dash-card" id="history">
        <div className="dash-card__header">
          <h3 className="dash-card__title">🕐 Conversation History</h3>
          <span className="dash-card__badge">{totalChats} total</span>
        </div>
        <div className="dash-card__body dash-card__body--table">
          {loadingChats ? (
            <div className="dash-loading">Loading history…</div>
          ) : recentChats.length === 0 ? (
            <div className="dash-empty">
              <div className="dash-empty__icon">🌌</div>
              <p>No conversations yet. Start your first cosmic journey!</p>
              <button className="btn btn-primary" onClick={() => navigate('/')}>Start chatting</button>
            </div>
          ) : (
            <table className="history-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Conversation</th>
                  <th>Last Active</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentChats.map((chat, i) => (
                  <ChatRow key={chat._id} chat={chat} index={i} onOpen={openChat} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
