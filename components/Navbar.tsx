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
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session?.user);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
      <Link href="/" className="font-bold text-lg">DeliVid</Link>
      <div className="flex items-center gap-4 text-sm">
        {loggedIn ? (
          <>
            <Link href="/create" className="text-gray-300 hover:text-white">Create</Link>
            <Link href="/history" className="text-gray-300 hover:text-white">History</Link>
            <Link href="/help" className="text-gray-300 hover:text-white">Help</Link>
            <button onClick={handleSignOut} className="text-gray-300 hover:text-white">
              Sign Out
            </button>
          </>
        ) : (
          <Link href="/login" className="text-gray-300 hover:text-white">Sign In</Link>
        )}
      </div>
    </nav>
  );
}
