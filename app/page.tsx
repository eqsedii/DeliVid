"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LogoSpinner from "@/components/LogoSpinner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else router.push("/create");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.push("/create");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <img src="/logo.svg" alt="DeliVid" className="h-10 mb-8" />
      <h1 className="text-3xl font-bold mb-6">
        {isSignUp ? "Create your account" : "Welcome back"}
      </h1>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-3 rounded-lg bg-[#14141c] border border-[#24242e] outline-none focus:border-[#B15CF6] transition"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
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
              Please wait...
            </>
          ) : isSignUp ? (
            "Sign Up"
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <button
        onClick={() => setIsSignUp(!isSignUp)}
        className="mt-4 text-sm text-gray-400 underline"
      >
        {isSignUp ? "Already have an account? Sign in" : "No account? Sign up"}
      </button>
    </main>
  );
}
