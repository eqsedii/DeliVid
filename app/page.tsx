export default function Home() {
  return (
    <main className="min-h-[90vh] flex flex-col items-center justify-center px-6 text-center">
      <span className="text-xs uppercase tracking-widest text-gray-500 mb-4">
        Audio → Video, in seconds
      </span>
      <h1 className="text-5xl sm:text-6xl font-extrabold mb-5 leading-tight">
        Turn sound into<br />
        <span className="gradient-text">something worth watching</span>
      </h1>
      <p className="text-gray-400 mb-10 max-w-md">
        Upload your audio, pick a look, and DeliVid renders a polished video —
        ready to download or push to YouTube.
      </p>
      <a
        href="/create"
        className="gradient-btn text-white px-8 py-4 rounded-full font-bold text-lg hover:opacity-90 transition"
      >
        Start Creating
      </a>
    </main>
  );
}
