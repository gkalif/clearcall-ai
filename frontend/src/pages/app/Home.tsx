import { Link } from "react-router-dom";
import { Mic, MessageSquare, ChevronRight, Zap } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export default function AppHome() {
  const { user } = useAuth();

  return (
    <div className="p-5 space-y-6">
      {/* Greeting */}
      <div className="pt-2">
        <p className="text-gray-400 text-sm">Good to see you,</p>
        <h1 className="font-display text-2xl font-bold text-gray-900">{user?.name} 👋</h1>
      </div>

      {/* Hero CTA */}
      <div
        className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #00D1C9 0%, #5A00FF 100%)" }}
      >
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -bottom-4 -right-2 w-20 h-20 bg-white/10 rounded-full" />
        <Zap size={24} className="mb-3" />
        <h2 className="font-display text-xl font-bold mb-1">Send a clear message</h2>
        <p className="text-white/80 text-sm mb-4">
          Record your voice — we'll clean it up and re-speak it clearly for the business.
        </p>
        <Link
          to="/app/record"
          className="inline-flex items-center gap-2 bg-white text-[#5A00FF] font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-gray-50 transition"
        >
          <Mic size={16} />
          Record Now
        </Link>
      </div>

      {/* How it works */}
      <div>
        <h2 className="font-display font-bold text-gray-900 mb-3">How it works</h2>
        <div className="space-y-3">
          {[
            { step: "1", title: "Record your message", desc: "Speak naturally in your own voice.", color: "#00D1C9" },
            { step: "2", title: "AI captures every detail accurately", desc: "Every word and detail is captured accurately.", color: "#5A00FF" },
            { step: "3", title: "A clear version is created", desc: "A clear audio version is prepared for the business.", color: "#00D1C9" },
            { step: "4", title: "Business receives your full message", desc: "They receive your original message plus a complete transcript.", color: "#5A00FF" },
          ].map(({ step, title, desc, color }) => (
            <div key={step} className="flex items-start gap-4 card py-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ background: color }}
              >
                {step}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{title}</p>
                <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick link to messages */}
      <Link to="/app/messages" className="card flex items-center justify-between hover:shadow-md transition">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
            <MessageSquare size={20} className="text-[#5A00FF]" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">View message history</p>
            <p className="text-gray-400 text-xs">See past recordings & transcripts</p>
          </div>
        </div>
        <ChevronRight size={18} className="text-gray-300" />
      </Link>
    </div>
  );
}
