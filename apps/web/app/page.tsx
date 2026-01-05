export default function Home() {
  return (
    <main className="min-h-screen bg-primary-900 p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <h1 className="font-display text-5xl text-white">
          BJJ Poster Builder
        </h1>

        <p className="font-body text-lg text-primary-300">
          Tournament poster generator for BJJ athletes
        </p>

        <div className="flex gap-4">
          <button className="rounded-lg bg-primary-500 px-6 py-3 font-body font-semibold text-white hover:bg-primary-400">
            Get Started
          </button>
          <button className="rounded-lg border-2 border-accent-gold px-6 py-3 font-body font-semibold text-accent-gold hover:bg-accent-gold hover:text-primary-900">
            Learn More
          </button>
        </div>

        <div className="rounded-lg bg-primary-800 p-6">
          <p className="font-mono text-sm text-accent-gold-bright">
            Design tokens working correctly
          </p>
        </div>
      </div>
    </main>
  )
}
