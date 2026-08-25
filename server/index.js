const express = require("express");
const cors = require("cors");
const fs = require("fs");
const os = require("os");
const path = require("path");
const fetch = require("node-fetch");
const ffmpegPath = require("ffmpeg-static");
const ffmpeg = require("fluent-ffmpeg");
const { createClient } = require("@supabase/supabase-js");

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const FONT_URLS = {
  "sans-serif": "https://cdn.jsdelivr.net/gh/google/fonts@main/apache/roboto/static/Roboto-Regular.ttf",
  "serif": "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/merriweather/static/Merriweather-Regular.ttf",
  "monospace": "https://cdn.jsdelivr.net/gh/google/fonts@main/apache/robotomono/static/RobotoMono-Regular.ttf",
};

async function downloadTo(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}`);
  const buffer = await res.buffer();
  fs.writeFileSync(destPath, buffer);
  return destPath;
}

app.post("/render", async (req, res) => {
  const { projectId } = req.body;
  if (!projectId) return res.status(400).json({ error: "projectId required" });

  res.json({ started: true });

  const tmp = os.tmpdir();
  const audioPath = path.join(tmp, `${projectId}-audio`);
  const bgPath = path.join(tmp, `${projectId}-bg.jpg`);
  const fontPath = path.join(tmp, `${projectId}-font.ttf`);
  const outPath = path.join(tmp, `${projectId}-out.mp4`);

  try {
    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();
    if (error || !project) throw new Error("Project not found");

    await downloadTo(project.audio_url, audioPath);

    if (project.background_url) {
      await downloadTo(project.background_url, bgPath);
    }

    await downloadTo(FONT_URLS[project.font] || FONT_URLS["sans-serif"], fontPath);

    const safeText = (project.overlay_text || project.title || "")
      .replace(/:/g, "\\:")
      .replace(/'/g, "\\'");

    await new Promise((resolve, reject) => {
      let cmd = ffmpeg();

      if (project.background_url) {
        cmd = cmd.input(bgPath).inputOptions(["-loop 1"]);
      } else {
        cmd = cmd.input("color=c=0x101014:s=1280x720").inputFormat("lavfi");
      }

      cmd
        .input(audioPath)
        .complexFilter([
          `[0:v]scale=1280:720,drawtext=fontfile='${fontPath}':text='${safeText}':fontcolor=${project.font_color.replace(
            "#",
            "0x"
          )}:fontsize=${project.font_size}:x=(w-text_w)/2:y=(h-text_h)/2[v]`,
        ])
        .outputOptions([
          "-map [v]",
          "-map 1:a",
          "-c:v libx264",
          "-tune stillimage",
          "-c:a aac",
          "-b:a 192k",
          "-pix_fmt yuv420p",
          "-shortest",
        ])
        .output(outPath)
        .on("end", resolve)
        .on("error", reject)
        .run();
    });

    const fileBuffer = fs.readFileSync(outPath);
    const videoPath = `${project.user_id}/${projectId}.mp4`;

    await supabase.storage.from("videos").upload(videoPath, fileBuffer, {
      contentType: "video/mp4",
      upsert: true,
    });

    const { data: publicUrl } = supabase.storage.from("videos").getPublicUrl(videoPath);

    await supabase
      .from("projects")
      .update({ video_url: publicUrl.publicUrl, status: "done" })
      .eq("id", projectId);
  } catch (err) {
    console.error(err);
    await supabase.from("projects").update({ status: "failed" }).eq("id", projectId);
  } finally {
    [audioPath, bgPath, fontPath, outPath].forEach((f) => {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });
  }
});

app.get("/", (req, res) => res.send("DeliVid backend running"));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
