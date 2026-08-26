"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session?.user);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-[#0a0a0f]/90 backdrop-blur border-b border-[#1c1c26]">
      <Link href="/" className="flex items-center">
        <img src="/logo.svg" alt="DeliVid" className="h-8" />
      </Link>
      <div className="flex items-center gap-5 text-sm font-medium">
        {loggedIn ? (
          <>
            <Link href="/create" className="text-gray-400 hover:text-white transition">Create</Link>
            <Link href="/history" className="text-gray-400 hover:text-white transition">History</Link>
            <Link href="/help" className="text-gray-400 hover:text-white transition">Help</Link>
            <button onClick={handleSignOut} className="text-gray-400 hover:text-white transition">
              Sign Out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="gradient-btn text-white px-4 py-2 rounded-full font-semibold text-sm"
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
