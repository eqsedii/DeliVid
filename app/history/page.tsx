"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LogoSpinner from "@/components/LogoSpinner";
import { shareVideoToYoutube } from "@/lib/shareVideo";

export default function CreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [userId, setUserId] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [existingAudioUrl, setExistingAudioUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("My Video");
  const [overlayText, setOverlayText] = useState("");
  const [font, setFont] = useState("sans-serif");
  const [fontSize, setFontSize] = useState(48);
  const [fontColor, setFontColor] = useState("#ffffff");
  const [bgUrl, setBgUrl] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [status, setStatus] = useState("");
  const [bgLoading, setBgLoading] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login");
      else setUserId(data.user.id);
    });
  }, [router]);

  useEffect(() => {
    if (!editId) return;

    supabase
      .from("projects")
      .select("*")
      .eq("id", editId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) return;
        setTitle(data.title || "My Video");
        setOverlayText(data.overlay_text || "");
        setFont(data.font || "sans-serif");
        setFontSize(data.font_size || 48);
        setFontColor(data.font_color || "#ffffff");
        setBgUrl(data.background_url || "");
        setExistingAudioUrl(data.audio_url || null);
      });
  }, [editId]);

  useEffect(() => {
    if (!projectId || !polling) return;

    const interval = setInterval(async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("video_url, status")
        .eq("id", projectId)
        .single();

      if (error) return;

      if (data.status === "done" && data.video_url) {
        setVideoUrl(data.video_url);
        setStatus("");
        setPolling(false);
        clearInterval(interval);
      } else if (data.status === "failed") {
        setStatus("Rendering failed. Please try again.");
        setPolling(false);
        clearInterval(interval);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [projectId, polling]);

  const generateAiBackground = () => {
    if (!aiPrompt) return;
    setBgLoading(true);
    setBgUrl("");
    const enhanced = `${aiPrompt}, high quality, detailed, cinematic lighting, 4k`;
    const encoded = encodeURIComponent(enhanced);
    const seed = Math.floor(Math.random() * 100000);
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=1280&height=720&nologo=true&model=flux&seed=${seed}`;
    const img = new window.Image();
    img.onload = () => {
      setBgUrl(url);
      setBgLoading(false);
    };
    img.onerror = () => setBgLoading(false);
    img.src = url;
  };

  const handleSubmit = async () => {
    if ((!audioFile && !existingAudioUrl) || !userId) return;
    setVideoUrl(null);
    setStatus("Preparing audio...");

    let audioPublicUrl = existingAudioUrl;

    if (audioFile) {
      const audioPath = `${userId}/${Date.now()}-${audioFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("audio")
        .upload(audioPath, audioFile);

      if (uploadError) {
        setStatus("Upload failed: " + uploadError.message);
        return;
      }

      const { data } = supabase.storage.from("audio").getPublicUrl(audioPath);
      audioPublicUrl = data.publicUrl;
    }

    setStatus("Saving project...");

    const { data: project, error: dbError } = await supabase
      .from("projects")
      .insert({
        user_id: userId,
        title,
        overlay_text: overlayText,
        audio_url: audioPublicUrl,
        background_url: bgUrl || null,
        font,
        font_size: fontSize,
        font_color: fontColor,
        status: "processing",
      })
      .select()
      .single();

    if (dbError) {
      setStatus("Save failed: " + dbError.message);
      return;
    }

    setProjectId(project.id);
    setStatus("Rendering your video — this can take a few minutes on the free tier...");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      if (!res.ok) throw new Error("Backend error");
      setPolling(true);
    } catch (err) {
      setStatus("Project saved, but rendering failed to start. Try again from history.");
    }
  };

  const inputClass =
    "w-full p-3 rounded-xl bg-[#14141c] border border-[#24242e] outline-none focus:border-[#B15CF6] transition text-white";

  return (
    <main className="min-h-screen px-6 py-10 max-w-xl mx-auto">
      <h1 className="text-4xl font-extrabold mb-8">
        {editId ? "Re-edit" : "Create a"} <span className="gradient-text">Video</span>
      </h1>

      <div className="card p-6 space-y-6">
        <div>
          <label className="block mb-2 text-sm text-gray-400">Project title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block mb-2 text-sm text-gray-400">
            {existingAudioUrl ? "Replace audio (optional)" : "Upload audio"}
          </label>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:gradient-btn file:text-white"
          />
          {existingAudioUrl && !audioFile && (
            <p className="text-xs text-gray-500 mt-2">Using previously uploaded audio.</p>
          )}
        </div>

        <div>
          <label className="block mb-2 text-sm text-gray-400">Text to display on video</label>
          <input
            value={overlayText}
            onChange={(e) => setOverlayText(e.target.value)}
            placeholder="e.g. Episode 1 - The Beginning"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block mb-2 text-sm text-gray-400">
            AI background — describe an image
          </label>
          <div className="flex gap-2">
            <input
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. calm blue ocean sunset"
              className={inputClass}
            />
            <button
              onClick={generateAiBackground}
              disabled={bgLoading}
              className={`px-5 rounded-xl gradient-btn font-semibold whitespace-nowrap flex items-center gap-2 disabled:opacity-60 ${
                bgLoading ? "glow-btn" : ""
              }`}
            >
              {bgLoading ? <LogoSpinner size={16} /> : "Generate"}
            </button>
          </div>
          {bgUrl && (
            <img src={bgUrl} alt="background preview" className="w-full rounded-xl mt-3" />
          )}
        </div>

        <div>
          <label className="block mb-2 text-sm text-gray-400">Font</label>
          <select value={font} onChange={(e) => setFont(e.target.value)} className={inputClass}>
            <option value="sans-serif">Sans Serif</option>
            <option value="serif">Serif</option>
            <option value="monospace">Monospace</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 text-sm text-gray-400">Font size: {fontSize}px</label>
          <input
            type="range"
            min={24}
            max={96}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full accent-[#B15CF6]"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm text-gray-400">Font color</label>
          <input
            type="color"
            value={fontColor}
            onChange={(e) => setFontColor(e.target.value)}
            className="w-full h-12 rounded-xl bg-[#14141c] border border-[#24242e]"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={(!audioFile && !existingAudioUrl) || !!status}
          className={`w-full flex items-center justify-center gap-2 text-white p-3 rounded-xl font-semibold transition gradient-btn disabled:opacity-40 ${
            status ? "glow-btn" : ""
          }`}
        >
          {status ? (
            <>
              <LogoSpinner size={18} />
              Working...
            </>
          ) : editId ? (
            "Regenerate Video"
          ) : (
            "Generate Video"
          )}
        </button>

        {status && <p className="text-sm text-gray-400">{status}</p>}

        {videoUrl && (
          <div className="pt-4 border-t border-[#24242e] space-y-4">
            <p className="text-sm font-semibold text-green-400">Your video is ready!</p>
            <video src={videoUrl} controls className="w-full rounded-xl" />
            <div className="flex gap-3 flex-wrap">
              <a
                href={videoUrl}
                download
                className="flex-1 text-center gradient-btn text-white px-4 py-3 rounded-xl font-semibold"
              >
                Download to Phone
              </a>
              <button
                onClick={async () => {
                  setSharing(true);
                  const shared = await shareVideoToYoutube(videoUrl, title);
                  setSharing(false);
                  if (!shared) window.open("https://www.youtube.com/upload", "_blank");
                }}
                disabled={sharing}
                className="flex-1 flex items-center justify-center gap-2 text-center bg-red-600 text-white px-4 py-3 rounded-xl font-semibold disabled:opacity-60"
              >
                {sharing ? <LogoSpinner size={16} /> : "Upload to YouTube"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
                                           }
