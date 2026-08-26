export async function shareVideoToYoutube(videoUrl: string, title: string) {
  try {
    const response = await fetch(videoUrl);
    const blob = await response.blob();
    const file = new File([blob], `${title || "video"}.mp4`, { type: "video/mp4" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: title || "My DeliVid video",
        text: "Check out this video I made with DeliVid",
      });
      return true;
    }
    return false;
  } catch (err) {
    console.error("Share failed:", err);
    return false;
  }
}
