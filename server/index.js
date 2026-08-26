const express = require("express");
const cors = require("cors");
const fs = require("fs");
const os = require("os");
const path = require("path");
const fetch = require("node-fetch");
const sharp = require("sharp");
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

const FONT_FILE = path.join(__dirname, "fonts/DejaVuSans.ttf");
const FONT_BASE64 = fs.readFileSync(FONT_FILE).toString("base64");

async function downloadTo(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}`);
  const buffer = await res.buffer();
  fs.writeFileSync(destPath, buffer);
  return destPath;
}

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function renderTextPng(text, fontSize, fontColor, outPath) {
  const width = 1280;
  const height = 200;
  const safe = escapeXml(text || "");

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @font-face {
            font-family: 'DeliVidFont';
            src: url(data:font/ttf;base64,${FONT_BASE64}) format('truetype');
          }
        </style>
      </defs>
      <text
        x="50%"
        y="50%"
        font-family="DeliVidFont"
        font-size="${fontSize}"
        fill="${fontColor}"
        text-anchor="middle"
        dominant-baseline="middle"
      >${safe}</text>
    </svg>
  `;

  await sharp(Buffer.from(svg)).png().toFile(outPath);
}

app.post("/render", async (req, res) => {
  const { projectId } = req.body;
  if (!projectId) return res.status(400).json({ error: "projectId required" });

  res.json({ started: true });

  const tmp = os.tmpdir();
  const audioPath = path.join(tmp, `${projectId}-audio`);
  const bgPath = path.join(tmp, `${projectId}-bg.jpg`);
  const textPath = path.join(tmp, `${projectId}-text.png`);
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

    await renderTextPng(
      project.overlay_text || project.title || "",
      project.font_size || 48,
      project.font_color || "#ffffff",
      textPath
    );

    await new Promise((resolve, reject) => {
      let cmd = ffmpeg();

      if (project.background_url) {
        cmd = cmd.input(bgPath).inputOptions(["-loop 1"]);
      } else {
        cmd = cmd.input("color=c=0x101014:s=1280x720").inputFormat("lavfi");
      }

      cmd
        .input(textPath)
        .inputOptions(["-loop 1"])
        .input(audioPath)
        .complexFilter([
          "[0:v]scale=1280:720[bg]",
          "[bg][1:v]overlay=(W-w)/2:(H-h)/2[v]",
        ])
        .outputOptions([
          "-map [v]",
          "-map 2:a",
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
    [audioPath, bgPath, textPath, outPath].forEach((f) => {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });
  }
});

app.get("/", (req, res) => res.send("DeliVid backend running"));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
