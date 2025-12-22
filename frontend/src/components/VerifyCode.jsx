"use client";

import { useEffect, useRef, useState } from "react";

/**
 * VerifyCode
 * Props:
 *  - email: string (to show)
 *  - onVerify(code: string): Promise<void>
 *  - onResend(): Promise<void>
 *  - onBack(): void
 *  - cooldown: number (seconds left) optional
 *
 * This component manages 6 single-char inputs and calls onVerify when filled.
 */

export default function VerifyCode({ email, onVerify, onResend, onBack, cooldown = 0 }) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    // reset when email changes
    setDigits(["", "", "", "", "", ""]);
    setError("");
    setSuccess("");
  }, [email]);

  const handleChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const copy = [...digits];
    copy[idx] = val.slice(-1);
    setDigits(copy);
    setError("");
    setSuccess("");

    // move focus
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();

    // auto-submit
    if (copy.every((d) => d !== "")) {
      const code = copy.join("");
      submit(code);
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(text)) {
      const arr = text.split("");
      setDigits(arr);
      inputRefs.current[5]?.focus();
      submit(text);
    }
    e.preventDefault();
  };

  const submit = async (code) => {
    setLoading(true);
    setError("");
    try {
      await onVerify(code);
      setSuccess("Vérification réussie !");
    } catch (err) {
      const msg = err?.message || err?.response?.data?.error || "Code invalide";
      setError(msg);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    setError("");
    try {
      await onResend();
      setSuccess("Code renvoyé (vérifiez votre ancien email).");
    } catch (err) {
      setError(err?.message || "Erreur renvoi code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-700">Code envoyé à : <span className="font-medium">{email}</span></div>

      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            maxLength={1}
            inputMode="numeric"
            className="w-12 h-12 text-center text-xl font-medium border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={loading}
            autoFocus={i === 0}
          />
        ))}
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {success && <div className="text-sm text-green-600">{success}</div>}

      <div className="flex gap-2">
        <button
          onClick={() => submit(digits.join(""))}
          disabled={loading || digits.some((d) => d === "")}
          className="flex-1 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {loading ? "Vérification..." : "Vérifier"}
        </button>

        <button onClick={onBack} className="py-2 px-4 bg-slate-100 rounded-lg">
          Retour
        </button>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <div>
          {cooldown > 0 ? (
            <span>Renvoyer dans {cooldown}s</span>
          ) : (
            <button onClick={handleResend} className="text-blue-600 font-medium">
              {loading ? "Envoi..." : "Renvoyer le code"}
            </button>
          )}
        </div>
        <div className="text-xs">Valable 10 minutes</div>
      </div>
    </div>
  );
}
