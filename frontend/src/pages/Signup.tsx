import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { Logo, Spinner } from "../components/shared";

export default function Signup() {
  const [mode, setMode] = useState<"user" | "business">("user");
  const [name, setName] = useState("");
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
      const fn = mode === "user" ? authAPI.userSignup : authAPI.businessSignup;
      const res = await fn({ email, name, password });
      const { access_token, role, name: userName, id } = res.data;
      login({ id, name: userName, role, token: access_token });
      navigate(role === "business" ? "/business/dashboard" : "/app/onboarding");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Signup failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="lg" />
          <p className="text-gray-400 text-sm mt-2">Create your account</p>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-gray-100 rounded-full p-1 mb-6">
          {(["user", "business"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 text-sm font-semibold rounded-full transition-all ${
                mode === m ? "bg-white shadow text-gray-900" : "text-gray-500"
              }`}
            >
              {m === "user" ? "I'm a Client" : "I'm a Business"}
            </button>
          ))}
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                {mode === "business" ? "Business Name" : "Full Name"}
              </label>
              <input
                className="input"
                type="text"
                placeholder={mode === "business" ? "Acme Corp" : "Chen Wei"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
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
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? <Spinner size={18} /> : null}
              Create Account
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-[#5A00FF] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
