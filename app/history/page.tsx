"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { shareVideoToYoutube } from "@/lib/shareVideo";
import LogoSpinner from "@/components/LogoSpinner";

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
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProjects = async () => {
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

  useEffect(() => {
    loadProjects();
  }, []);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Delete this project? This can't be undone.");
    if (!confirmed) return;

    setDeletingId(id);
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (!error) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
    setDeletingId(null);
  };

  const handleUpload = async (project: Project) => {
    if (!project.video_url) return;
    setSharingId(project.id);
    const shared = await shareVideoToYoutube(project.video_url, project.title);
    setSharingId(null);
    if (!shared) {
      window.open("https://www.youtube.com/upload", "_blank");
    }
  };

  return (
    <main className="min-h-screen px-6 py-10 max-w-xl mx-auto">
      <h1 className="text-4xl font-extrabold mb-8">
        Your <span className="gradient-text">Projects</span>
      </h1>

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
          <div key={p.id} className="card p-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold">{p.title}</h2>
              <span className="text-xs text-gray-400 uppercase">{p.status}</span>
            </div>

            {p.video_url ? (
              <>
                <video src={p.video_url} controls className="w-full rounded-xl mb-3" />
                <div className="flex gap-2 flex-wrap">
                  <a
                    href={p.video_url}
                    download
                    className="gradient-btn text-white px-4 py-2 rounded-xl text-sm font-semibold"
                  >
                    Download .mp4
                  </a>
                  <button
                    onClick={() => handleUpload(p)}
                    disabled={sharingId === p.id}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
                  >
                    {sharingId === p.id ? <LogoSpinner size={14} /> : "Upload to YouTube"}
                  </button>
                  <a
                    href={`/create?edit=${p.id}`}
                    className="bg-[#24242e] text-white px-4 py-2 rounded-xl text-sm font-semibold"
                  >
                    Re-edit
                  </a>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                    className="flex items-center gap-2 bg-transparent border border-red-500 text-red-400 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
                  >
                    {deletingId === p.id ? <LogoSpinner size={14} /> : "Delete"}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-400">
                  {p.status === "processing"
                    ? "Still rendering — refresh in a bit."
                    : "Not rendered yet."}
                </p>
                <button
                  onClick={() => handleDelete(p.id)}
                  disabled={deletingId === p.id}
                  className="flex items-center gap-2 bg-transparent border border-red-500 text-red-400 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-60"
                >
                  {deletingId === p.id ? <LogoSpinner size={12} /> : "Delete"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
