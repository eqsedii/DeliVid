"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import LogoSpinner from "@/components/LogoSpinner";

export default function HelpPage() {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();

    const { error: dbError } = await supabase.from("feedback").insert({
      user_id: userData.user?.id || null,
      message,
      email: email || userData.user?.email || null,
    });

    if (dbError) {
      setError(dbError.message);
      setLoading(false);
      return;
    }

    await fetch("/api/send-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, email: email || userData.user?.email }),
    });

    setSent(true);
    setMessage("");
    setLoading(false);
  };

  return (
    <main className="min-h-screen px-6 py-10 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-6">Help & Feedback</h1>

      {sent ? (
        <p className="text-green-400">Thanks! Your feedback was sent.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what's on your mind, or report a bug..."
            required
            rows={5}
            className="w-full p-3 rounded-lg bg-[#14141c] border border-[#24242e] outline-none focus:border-[#B15CF6] transition"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email (optional if signed in)"
            className="w-full p-3 rounded-lg bg-[#14141c] border border-[#24242e] outline-none focus:border-[#B15CF6] transition"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 gradient-btn text-white p-3 rounded-lg font-semibold transition disabled:opacity-60 ${
              loading ? "glow-btn" : ""
            }`}
          >
            {loading ? (
              <>
                <LogoSpinner size={18} />
                Sending...
              </>
            ) : (
              "Send Feedback"
            )}
          </button>
        </form>
      )}
    </main>
  );
}
