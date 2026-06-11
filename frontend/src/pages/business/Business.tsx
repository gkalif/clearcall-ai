import { useEffect, useState } from "react";
import { Link, useParams, useNavigate, Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, Settings, LogOut, ChevronRight, ChevronLeft } from "lucide-react";
import { businessAPI, audioUrl } from "../../lib/api";
import { StatusBadge, AudioPlayer, Spinner, EmptyState } from "../../components/shared";
import { useAuth } from "../../hooks/useAuth";
import { Logo } from "../../components/shared";

// ── Business Layout ───────────────────────────────────────────
export function BusinessLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col p-5 gap-2">
        <div className="mb-6">
          <Logo size="sm" />
          <p className="text-xs text-gray-400 mt-1 truncate">{user?.name}</p>
        </div>

        {[
          { to: "/business/dashboard", icon: LayoutDashboard, label: "Inbox" },
          { to: "/business/settings", icon: Settings, label: "Settings" },
        ].map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-teal-light text-[#00A8A2]"
                  : "text-gray-500 hover:bg-gray-50"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        <div className="mt-auto">
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-50 w-full"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}

// ── Business Dashboard (Inbox) ────────────────────────────────
export function BusinessDashboard() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    businessAPI.getMessages()
      .then((r) => setMessages(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statuses = ["all", "new", "processing", "complete", "reviewed"];
  const filtered = filter === "all" ? messages : messages.filter((m) => m.status === filter);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-gray-900">Client Inbox</h1>
        <p className="text-gray-400 mt-1">
          {messages.length} message{messages.length !== 1 ? "s" : ""} total
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === s
                ? "bg-[#00D1C9] text-white"
                : "bg-white text-gray-500 border border-gray-200 hover:border-[#00D1C9]"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {s !== "all" && (
              <span className="ml-1.5 opacity-70">
                ({messages.filter((m) => m.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="📭" title="No messages" subtitle="No messages in this category yet." />
      ) : (
        <div className="space-y-3">
          {filtered.map((msg) => (
            <Link
              key={msg.id}
              to={`/business/messages/${msg.id}`}
              className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between hover:shadow-md transition"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <StatusBadge status={msg.status} />
                  <span className="text-xs text-gray-400">
                    Client #{msg.user_id} · {new Date(msg.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 truncate">
                  {msg.transcript?.summary || "Processing…"}
                </p>
              </div>
              <ChevronRight size={18} className="text-gray-300 ml-4 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Business Message Detail ───────────────────────────────────
export function BusinessMessageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [msg, setMsg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    businessAPI.getMessage(Number(id))
      .then((r) => setMsg(r.data))
      .catch(() => navigate("/business/dashboard"))
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (status: string) => {
    setUpdating(true);
    try {
      const res = await businessAPI.updateStatus(Number(id), status);
      setMsg(res.data);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;
  if (!msg) return null;

  const origAudio = audioUrl(msg.original_audio_path);
  const aiAudio = audioUrl(msg.audio_output?.file_path);

  const statusFlow = ["new", "processing", "complete", "reviewed"];

  return (
    <div className="p-8 max-w-3xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm mb-6"
      >
        <ChevronLeft size={18} /> Back to inbox
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Message #{msg.id}</h1>
          <div className="flex items-center gap-3 mt-1">
            <StatusBadge status={msg.status} />
            <span className="text-sm text-gray-400">
              {new Date(msg.created_at).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Status update */}
        <div className="flex items-center gap-2">
          <select
            value={msg.status}
            onChange={(e) => updateStatus(e.target.value)}
            disabled={updating}
            className="input text-sm py-2 w-auto pr-8"
          >
            {statusFlow.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          {updating && <Spinner size={16} />}
        </div>
      </div>

      <div className="space-y-5">
        {/* Audio */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Audio Playback</h2>
          {origAudio && <AudioPlayer src={origAudio} label="🎙️ Original client recording" accent="purple" />}
          {aiAudio ? (
            <AudioPlayer src={aiAudio} label="✨ AI clarified voice" accent="teal" />
          ) : (
            <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-400">
              AI clarified audio not yet available
            </div>
          )}
        </div>

        {/* Summary */}
        {msg.transcript?.summary && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-800 mb-3">📋 AI Summary</h2>
            <p className="text-gray-700 leading-relaxed">{msg.transcript.summary}</p>
          </div>
        )}

        {/* Cleaned transcript */}
        {msg.transcript?.cleaned_text && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-800 mb-3">✏️ Cleaned Transcript</h2>
            <p className="text-gray-700 leading-relaxed">{msg.transcript.cleaned_text}</p>
          </div>
        )}

        {/* Raw transcript */}
        {msg.transcript?.raw_text && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-800 mb-3">🔤 Raw Transcript (original STT)</h2>
            <p className="text-gray-500 italic leading-relaxed">{msg.transcript.raw_text}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Business Settings ─────────────────────────────────────────
export function BusinessSettings() {
  const { user } = useAuth();
  return (
    <div className="p-8 max-w-xl">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-600">Business name</label>
          <p className="text-gray-900 mt-1">{user?.name}</p>
        </div>
        <hr />
        <p className="text-sm text-gray-400">
          More settings (notification preferences, webhook URL, team members) coming in v2.
        </p>
      </div>
    </div>
  );
}
