"use client";
import LogoSpinner from "@/components/LogoSpinner";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CreatePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [title, setTitle] = useState("My Video");
  const [overlayText, setOverlayText] = useState("");
  const [font, setFont] = useState("sans-serif");
  const [fontSize, setFontSize] = useState(48);
  const [fontColor, setFontColor] = useState("#ffffff");
  const [bgUrl, setBgUrl] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login");
      else setUserId(data.user.id);
    });
  }, [router]);

  const generateAiBackground = () => {
    if (!aiPrompt) return;
    const enhanced = `${aiPrompt}, high quality, detailed, cinematic lighting, 4k`;
    const encoded = encodeURIComponent(enhanced);
    const seed = Math.floor(Math.random() * 100000);
    setBgUrl(
      `https://image.pollinations.ai/prompt/${encoded}?width=1280&height=720&nologo=true&model=flux&seed=${seed}`
    );
  };

  const handleSubmit = async () => {
    if (!audioFile || !userId) return;
    setStatus("Uploading audio...");

    const audioPath = `${userId}/${Date.now()}-${audioFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from("audio")
      .upload(audioPath, audioFile);

    if (uploadError) {
      setStatus("Upload failed: " + uploadError.message);
      return;
    }

    const { data: audioPublicUrl } = supabase.storage
      .from("audio")
      .getPublicUrl(audioPath);

    setStatus("Saving project...");

    const { data: project, error: dbError } = await supabase
      .from("projects")
      .insert({
        user_id: userId,
        title,
        overlay_text: overlayText,
        audio_url: audioPublicUrl.publicUrl,
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

    setStatus("Sending to video processor...");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      if (!res.ok) throw new Error("Backend error");
      setStatus("Video is rendering! Check your history page shortly.");
    } catch (err) {
      setStatus("Project saved, but rendering failed to start. Try again from history.");
    }
  };

  return (
    <main className="min-h-screen px-6 py-10 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create a Video</h1>

      <label className="block mb-2 text-sm text-gray-400">Project title</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-3 mb-5 rounded-lg bg-gray-800 border border-gray-700"
      />

      <label className="block mb-2 text-sm text-gray-400">Upload audio</label>
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
        className="w-full mb-5 text-sm"
      />

      <label className="block mb-2 text-sm text-gray-400">Text to display on video</label>
      <input
        value={overlayText}
        onChange={(e) => setOverlayText(e.target.value)}
        placeholder="e.g. Episode 1 - The Beginning"
        className="w-full p-3 mb-5 rounded-lg bg-gray-800 border border-gray-700"
      />

      <label className="block mb-2 text-sm text-gray-400">
        AI background — describe an image
      </label>
      <div className="flex gap-2 mb-3">
        <input
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="e.g. calm blue ocean sunset"
          className="flex-1 p-3 rounded-lg bg-gray-800 border border-gray-700"
        />
        <button
          onClick={generateAiBackground}
          className="px-4 rounded-lg bg-indigo-600 font-semibold"
        >
          Generate
        </button>
      </div>
      {bgUrl && (
        <img src={bgUrl} alt="background preview" className="w-full rounded-lg mb-5" />
      )}

      <label className="block mb-2 text-sm text-gray-400">Font</label>
      <select
        value={font}
        onChange={(e) => setFont(e.target.value)}
        className="w-full p-3 mb-5 rounded-lg bg-gray-800 border border-gray-700"
      >
        <option value="sans-serif">Sans Serif</option>
        <option value="serif">Serif</option>
        <option value="monospace">Monospace</option>
      </select>

      <label className="block mb-2 text-sm text-gray-400">Font size: {fontSize}px</label>
      <input
        type="range"
        min={24}
        max={96}
        value={fontSize}
        onChange={(e) => setFontSize(Number(e.target.value))}
        className="w-full mb-5"
      />

      <label className="block mb-2 text-sm text-gray-400">Font color</label>
      <input
        type="color"
        value={fontColor}
        onChange={(e) => setFontColor(e.target.value)}
        className="w-full h-12 mb-6 rounded-lg bg-gray-800 border border-gray-700"
      />
<button
  onClick={handleSubmit}
  disabled={!audioFile || !!status}
  className={`w-full flex items-center justify-center gap-2 text-white p-3 rounded-lg font-semibold transition gradient-btn disabled:opacity-40 ${
    status ? "glow-btn" : ""
  }`}
>
  {status ? (
    <>
      <LogoSpinner size={18} />
      Working...
    </>
  ) : (
    "Generate Video"
  )}
</button>
      <button
        onClick={handleSubmit}
        disabled={!audioFile}
        className="w-full bg-white text-black p-3 rounded-lg font-semibold disabled:opacity-40"
      >
        Generate Video
      </button>

      {status && <p className="mt-4 text-sm text-gray-400">{status}</p>}
    </main>
  );
}
