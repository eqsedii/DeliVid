"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Project = {
  id: string;
  title: string;
  video_url: string | null;
  audio_url: string | null;
  status: string;
  created_at: string;
};

export default function HistoryPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) setProjects(data as Project[]);
      setLoading(false);
    };
    load();
  }, [router]);

  const getYoutubeUploadLink = () => {
    return "https://www.youtube.com/upload";
  };

  return (
    <main className="min-h-screen px-6 py-10 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your Projects</h1>

      {loading && <p className="text-gray-400">Loading...</p>}
      {!loading && projects.length === 0 && (
        <p className="text-gray-400">
          No projects yet.{" "}
          <a href="/create" className="underline">
            Create one
          </a>
          .
        </p>
      )}

      <div className="space-y-4">
        {projects.map((p) => (
          <div
            key={p.id}
            className="bg-gray-800 border border-gray-700 rounded-lg p-4"
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold">{p.title}</h2>
              <span className="text-xs text-gray-400 uppercase">{p.status}</span>
            </div>

            {p.video_url ? (
              <>
                <video
                  src={p.video_url}
                  controls
                  className="w-full rounded-lg mb-3"
                />
                <div className="flex gap-2 flex-wrap">
                  <a
                    href={p.video_url}
                    download
                    className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    Download .mp4
                  </a>
                  <a
                    href={getYoutubeUploadLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-red-600 px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    Upload to YouTube
                  </a>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400">
                {p.status === "processing"
                  ? "Still rendering — refresh in a bit."
                  : "Not rendered yet."}
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
                }
