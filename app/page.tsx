import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black font-sans text-white">
      <main className="flex flex-col items-center gap-12 text-center max-w-4xl px-6">
        <div className="space-y-4">
          <div className="inline-block px-3 py-1 text-xs font-semibold tracking-widest text-blue-400 uppercase bg-blue-900/20 rounded-full border border-blue-500/30">
            Pixel Perfect AI
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-linear-to-b from-white to-neutral-400 bg-clip-text text-transparent">
            Pixel AI Editor
          </h1>
          <p className="max-w-xl mx-auto text-lg text-neutral-400 leading-relaxed md:text-xl">
            A high-performance, web-based pixel art editor with AI assistance. 
            Built for precision, speed, and creativity.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/editor"
            className="flex h-14 items-center justify-center rounded-xl bg-white px-8 text-black font-bold transition-all hover:scale-105 active:scale-95"
          >
            Launch Editor
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-14 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/50 px-8 text-white font-semibold transition-all hover:bg-neutral-800"
          >
            View GitHub
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 w-full">
          <FeatureCard 
            title="Fast Rendering" 
            description="Powered by PixiJS for zero-latency pixel manipulation." 
          />
          <FeatureCard 
            title="AI Assisted" 
            description="Generate sprites and upscale your art with integrated AI tools." 
          />
          <FeatureCard 
            title="SaaS Ready" 
            description="Save projects, collaborate, and export in various formats." 
          />
        </div>
      </main>

      <footer className="mt-20 py-8 text-neutral-600 text-sm">
        © 2026 Pixel AI Editor. Engineering Guide followed.
      </footer>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 text-left hover:border-neutral-700 transition-colors">
      <h3 className="text-lg font-bold mb-2 text-white">{title}</h3>
      <p className="text-sm text-neutral-400 leading-relaxed">{description}</p>
    </div>
  );
}
