import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

const accents = [
  "Mandarin-influenced English",
  "Hindi-influenced English",
  "Arabic-influenced English",
  "French-influenced English",
  "Spanish-influenced English",
  "Cantonese-influenced English",
  "Tagalog-influenced English",
  "Other",
];

export default function Onboarding() {
  const [selected, setSelected] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleFinish = () => {
    // TODO: Save accent profile to POST /accent-profile
    navigate("/app/home");
  };

  return (
    <div className="p-5 space-y-6">
      <div>
        <p className="text-[#00D1C9] text-sm font-semibold">Step {step} of 2</p>
        <h1 className="font-display text-2xl font-bold text-gray-900 mt-1">
          {step === 1 ? "Help us capture your message accurately" : "You're all set!"}
        </h1>
      </div>

      {step === 1 ? (
        <>
          <p className="text-gray-400 text-sm">
            Select your primary language background so our AI can better understand your speech patterns and capture every detail correctly.
          </p>

          <div className="space-y-2">
            {accents.map((a) => (
              <button
                key={a}
                onClick={() => setSelected(a)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  selected === a
                    ? "border-[#00D1C9] bg-teal-50 text-[#00A8A2]"
                    : "border-gray-100 bg-white text-gray-700 hover:border-gray-200"
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!selected}
            className="btn-primary w-full disabled:opacity-40"
          >
            Continue
          </button>
        </>
      ) : (
        <div className="text-center space-y-6 py-8">
          <CheckCircle size={64} className="text-[#00D1C9] mx-auto" />
          <div>
            <p className="font-display font-bold text-xl text-gray-900">Profile saved!</p>
            <p className="text-gray-400 text-sm mt-2">
              Accent: <strong className="text-gray-700">{selected}</strong>
            </p>
            <p className="text-gray-400 text-sm mt-1">
              ClearCall AI will use this to improve your transcripts over time.
            </p>
          </div>
          <button onClick={handleFinish} className="btn-primary px-10">
            Go to Home
          </button>
        </div>
      )}
    </div>
  );
}
