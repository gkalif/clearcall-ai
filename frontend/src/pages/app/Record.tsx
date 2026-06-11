import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Square, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { messagesAPI } from "../../lib/api";
import { Spinner } from "../../components/shared";

type State = "idle" | "recording" | "ready" | "uploading" | "done" | "error";

export default function Record() {
  const [state, setState] = useState<State>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const navigate = useNavigate();

  const startRecording = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mediaRecorder.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setState("ready");
        stream.getTracks().forEach((t) => t.stop());
      };

      mr.start();
      setState("recording");
      setRecordSeconds(0);
      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      setError("Microphone access denied. Please allow microphone access and try again.");
      setState("idle");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorder.current?.stop();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioBlob(file);
    setAudioUrl(URL.createObjectURL(file));
    setState("ready");
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    setState("uploading");
    setError("");
    try {
      const form = new FormData();
      form.append("file", audioBlob, "recording.webm");
      await messagesAPI.upload(form);
      setState("done");
      setTimeout(() => navigate("/app/messages"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Upload failed. Try again.");
      setState("ready");
    }
  };

  const reset = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setState("idle");
    setRecordSeconds(0);
    setError("");
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="p-5 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Record Message</h1>
        <p className="text-gray-400 text-sm mt-1">Speak naturally — we'll clarify it for the business.</p>
      </div>

      {/* Main recording UI */}
      <div className="card text-center space-y-6 py-10">
        {state === "done" ? (
          <div className="space-y-3">
            <CheckCircle size={48} className="text-[#00D1C9] mx-auto" />
            <p className="font-display font-bold text-lg">Message Sent!</p>
            <p className="text-gray-400 text-sm">Processing in the background. Redirecting…</p>
          </div>
        ) : state === "uploading" ? (
          <div className="space-y-3">
            <Spinner size={40} />
            <p className="font-display font-bold text-lg">Uploading…</p>
            <p className="text-gray-400 text-sm">Sending your message for AI processing.</p>
          </div>
        ) : (
          <>
            {/* Mic button */}
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={state === "recording" ? stopRecording : startRecording}
                disabled={state === "ready"}
                className={`w-24 h-24 rounded-full flex items-center justify-center text-white transition-all shadow-lg ${
                  state === "recording"
                    ? "bg-red-500 scale-110 animate-pulse"
                    : state === "ready"
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-[#00D1C9] hover:bg-[#00A8A2] hover:scale-105"
                }`}
              >
                {state === "recording" ? <Square size={32} /> : <Mic size={32} />}
              </button>

              {state === "recording" && (
                <p className="text-red-500 font-mono font-bold text-xl">{formatTime(recordSeconds)}</p>
              )}

              {state === "idle" && (
                <p className="text-gray-400 text-sm">Tap to start recording</p>
              )}
            </div>

            {/* Playback */}
            {audioUrl && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Preview your recording</p>
                <audio src={audioUrl} controls className="w-full rounded-xl" />
              </div>
            )}

            {/* File upload alternative */}
            {state === "idle" && (
              <div className="border-t pt-5">
                <p className="text-gray-400 text-xs mb-3">Or upload an audio file</p>
                <label className="btn-outline cursor-pointer inline-flex items-center gap-2 text-sm">
                  <Upload size={16} />
                  Choose file
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            )}
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Action buttons */}
      {state === "ready" && (
        <div className="flex gap-3">
          <button onClick={reset} className="btn-outline flex-1">
            Re-record
          </button>
          <button onClick={handleSend} className="btn-primary flex-1">
            Send Message
          </button>
        </div>
      )}
    </div>
  );
}
