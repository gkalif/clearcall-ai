import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { Logo, Spinner } from "../components/shared";

export default function Login() {
  const [mode, setMode] = useState<"user" | "business">("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const fn = mode === "user" ? authAPI.userLogin : authAPI.businessLogin;
      const res = await fn({ email, password });
      const { access_token, role, name, id } = res.data;
      login({ id, name, role, token: access_token });
      navigate(role === "business" ? "/business/dashboard" : "/app/home");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12"
        style={{ background: "linear-gradient(135deg, #00D1C9 0%, #5A00FF 100%)" }}
      >
        <Logo size="lg" />
        <div className="text-white">
          <h2 className="font-display text-4xl font-bold mb-4">
            Every voice,<br />crystal clear.
          </h2>
          <p className="text-white/80 text-lg">
            AI-powered accent clarity for businesses and their clients.
          </p>
        </div>
        <div className="flex gap-3">
          {["Accent Detection", "AI Transcription", "Clear Voice"].map((t) => (
            <span key={t} className="bg-white/20 text-white text-xs px-3 py-1.5 rounded-full">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Logo />
          </div>

          <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-gray-400 text-sm mb-8">Sign in to your account to continue.</p>

          {/* Mode toggle */}
          <div className="flex bg-gray-100 rounded-full p-1 mb-8">
            {(["user", "business"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-semibold rounded-full transition-all ${
                  mode === m ? "bg-white shadow text-gray-900" : "text-gray-500"
                }`}
              >
                {m === "user" ? "Client" : "Business"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Password</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Spinner size={18} /> : null}
              Sign In
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-[#5A00FF] font-semibold hover:underline">
              Sign up
            </Link>
          </p>

          {/* Demo credentials hint */}
          <div className="mt-8 bg-gray-50 rounded-xl p-4 text-xs text-gray-400">
            <strong className="text-gray-600">Demo credentials:</strong>
            <br />
            Client: demo@clearcall.ai / password123
            <br />
            Business: business@clearcall.ai / password123
          </div>
        </div>
      </div>
    </div>
  );
}
