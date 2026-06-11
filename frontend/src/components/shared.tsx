import { Play, Pause, Loader2 } from "lucide-react";
import { useRef, useState } from "react";

// ── Logo ──────────────────────────────────────────────────────
export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "text-lg", md: "text-2xl", lg: "text-4xl" };
  return (
    <span className={`font-display font-bold ${sizes[size]}`}>
      <span style={{ color: "#00D1C9" }}>Clear</span>
      <span style={{ color: "#5A00FF" }}>Call</span>
      <span className="text-gray-400 font-light"> AI</span>
    </span>
  );
}

// ── Status Badge ──────────────────────────────────────────────
const statusMap: Record<string, string> = {
  new: "status-new",
  processing: "status-processing",
  complete: "status-complete",
  reviewed: "status-reviewed",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={statusMap[status] || "status-new"}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── Audio Player ──────────────────────────────────────────────
export function AudioPlayer({
  src,
  label,
  accent,
}: {
  src: string;
  label: string;
  accent?: "teal" | "purple";
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const color = accent === "purple" ? "#5A00FF" : "#00D1C9";

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => {});
      setPlaying(true);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
      <audio
        ref={audioRef}
        src={src}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={() => {
          const a = audioRef.current;
          if (a && a.duration) setProgress((a.currentTime / a.duration) * 100);
        }}
      />
      <button
        onClick={toggle}
        className="w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0"
        style={{ background: color }}
      >
        {playing ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, background: color }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <Loader2
      size={size}
      className="animate-spin text-[#00D1C9]"
    />
  );
}

// ── Empty State ───────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="font-display font-bold text-lg text-gray-800 mb-1">{title}</h3>
      <p className="text-gray-400 text-sm">{subtitle}</p>
    </div>
  );
}
