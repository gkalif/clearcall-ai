import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ChevronRight, ChevronLeft, RefreshCw } from "lucide-react";
import { messagesAPI, audioUrl } from "../../lib/api";
import { StatusBadge, AudioPlayer, Spinner, EmptyState } from "../../components/shared";

// ── Message List ──────────────────────────────────────────────
export function MessagesList() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    messagesAPI.list()
      .then((r) => setMessages(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;

  return (
    <div className="p-5">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-5">My Messages</h1>

      {messages.length === 0 ? (
        <EmptyState
          icon="🎙️"
          title="No messages yet"
          subtitle="Record your first message to get started."
        />
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <Link
              key={msg.id}
              to={`/app/messages/${msg.id}`}
              className="card flex items-center justify-between hover:shadow-md transition"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={msg.status} />
                  <span className="text-xs text-gray-400">#{msg.id}</span>
                </div>
                {msg.transcript?.summary ? (
                  <p className="text-sm text-gray-700 truncate">{msg.transcript.summary}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic">Processing…</p>
                )}
                <p className="text-xs text-gray-300 mt-1">
                  {new Date(msg.created_at).toLocaleDateString()}
                </p>
              </div>
              <ChevronRight size={18} className="text-gray-300 flex-shrink-0 ml-3" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Message Detail ────────────────────────────────────────────
export function MessageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [msg, setMsg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reprocessing, setReprocessing] = useState(false);

  const load = () => {
    setLoading(true);
    messagesAPI.get(Number(id))
      .then((r) => setMsg(r.data))
      .catch(() => navigate("/app/messages"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleReprocess = async () => {
    setReprocessing(true);
    try {
      await messagesAPI.reprocess(Number(id));
      setTimeout(load, 2000);
    } finally {
      setReprocessing(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;
  if (!msg) return null;

  const origAudio = audioUrl(msg.original_audio_path);
  const aiAudio = audioUrl(msg.audio_output?.file_path);

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="font-display font-bold text-xl text-gray-900">Message #{msg.id}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <StatusBadge status={msg.status} />
            <span className="text-xs text-gray-400">
              {new Date(msg.created_at).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Audio players */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-gray-800 text-sm">Audio</h2>
        {origAudio && <AudioPlayer src={origAudio} label="Original Recording" accent="purple" />}
        {aiAudio && msg.status === "complete" ? (
          <AudioPlayer src={aiAudio} label="AI Clear Voice" accent="teal" />
        ) : (
          <div className="bg-gray-50 rounded-xl p-3 text-center text-sm text-gray-400">
            {msg.status === "processing" ? "AI voice being generated…" : "AI voice not yet available"}
          </div>
        )}
      </div>

      {/* Transcript */}
      {msg.transcript && (
        <>
          <div className="card space-y-3">
            <h2 className="font-semibold text-gray-800 text-sm">Summary</h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              {msg.transcript.summary || "—"}
            </p>
          </div>

          <div className="card space-y-3">
            <h2 className="font-semibold text-gray-800 text-sm">Cleaned Transcript</h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              {msg.transcript.cleaned_text || "—"}
            </p>
          </div>

          <div className="card space-y-3">
            <h2 className="font-semibold text-gray-800 text-sm">Raw Transcript (original STT)</h2>
            <p className="text-gray-500 text-sm leading-relaxed italic">
              {msg.transcript.raw_text || "—"}
            </p>
          </div>
        </>
      )}

      {/* Reprocess */}
      {msg.status === "new" && (
        <button
          onClick={handleReprocess}
          disabled={reprocessing}
          className="btn-outline w-full flex items-center justify-center gap-2"
        >
          {reprocessing ? <Spinner size={16} /> : <RefreshCw size={16} />}
          Reprocess Message
        </button>
      )}
    </div>
  );
}
