export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-5xl font-bold mb-4">DeliVid</h1>
      <p className="text-lg text-gray-400 mb-8 max-w-md">
        Turn your audio into a beautiful video, ready for YouTube — in seconds.
      </p>
      <a
        href="/create"
        className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition"
      >
        Get Started
      </a>
    </main>
  );
}
