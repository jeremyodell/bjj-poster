import { Camera, Download, Palette } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="min-h-screen bg-primary-900">
      {/* Hero Section */}
      <section className="relative min-h-screen px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid min-h-[80vh] items-center gap-12 lg:grid-cols-2">
            {/* Hero Content */}
            <div className="space-y-8">
              <span className="inline-block rounded-full border border-accent-gold bg-accent-gold/10 px-4 py-1.5 font-body text-sm text-accent-gold">
                Free to use
              </span>

              <h1 className="font-display text-4xl text-white sm:text-5xl lg:text-6xl">
                Create Tournament Posters in Minutes
              </h1>

              <p className="max-w-lg font-body text-lg text-primary-300 lg:text-xl">
                Design professional BJJ competition posters with your photos. No design skills
                needed.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Button asChild size="lg" className="text-base">
                  <Link href="/auth/signup">Get Started Free</Link>
                </Button>
              </div>
            </div>

            {/* Poster Showcase */}
            <div className="relative flex h-[500px] items-center justify-center lg:h-[600px]">
              <div className="relative h-full w-full max-w-md">
                {/* Back poster */}
                <div className="absolute left-0 top-1/2 h-[320px] w-[240px] -translate-y-1/2 -rotate-6 transform overflow-hidden rounded-lg shadow-2xl transition-transform duration-300 hover:scale-105 sm:h-[400px] sm:w-[300px]">
                  <Image
                    src="/images/examples/poster-3.svg"
                    alt="Example BJJ tournament poster with purple theme"
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Middle poster */}
                <div className="absolute left-1/2 top-1/2 z-10 h-[320px] w-[240px] -translate-x-1/2 -translate-y-1/2 transform overflow-hidden rounded-lg shadow-2xl transition-transform duration-300 hover:scale-105 sm:h-[400px] sm:w-[300px]">
                  <Image
                    src="/images/examples/poster-1.svg"
                    alt="Example BJJ tournament poster with blue theme"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>

                {/* Front poster */}
                <div className="absolute right-0 top-1/2 z-20 h-[320px] w-[240px] -translate-y-1/2 rotate-6 transform overflow-hidden rounded-lg shadow-2xl transition-transform duration-300 hover:scale-105 sm:h-[400px] sm:w-[300px]">
                  <Image
                    src="/images/examples/poster-2.svg"
                    alt="Example BJJ tournament poster with gold theme"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-primary-800 px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-16 text-center font-display text-3xl text-white sm:text-4xl">
            How It Works
          </h2>

          <div className="grid gap-8 md:grid-cols-3 md:gap-12">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-accent-gold bg-primary-700">
                  <Camera className="h-10 w-10 text-accent-gold" aria-hidden="true" />
                </div>
                <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 font-body text-sm font-bold text-white">
                  1
                </span>
              </div>
              <h3 className="mb-3 font-body text-xl font-semibold text-white">Upload Photo</h3>
              <p className="font-body text-primary-300">
                Add your athlete photo or use one from your gallery
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-accent-gold bg-primary-700">
                  <Palette className="h-10 w-10 text-accent-gold" aria-hidden="true" />
                </div>
                <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 font-body text-sm font-bold text-white">
                  2
                </span>
              </div>
              <h3 className="mb-3 font-body text-xl font-semibold text-white">Choose Template</h3>
              <p className="font-body text-primary-300">
                Pick from professionally designed tournament layouts
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-accent-gold bg-primary-700">
                  <Download className="h-10 w-10 text-accent-gold" aria-hidden="true" />
                </div>
                <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 font-body text-sm font-bold text-white">
                  3
                </span>
              </div>
              <h3 className="mb-3 font-body text-xl font-semibold text-white">Download & Share</h3>
              <p className="font-body text-primary-300">
                Export high-quality images ready for print or social media
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA Section */}
      <section className="bg-primary-900 px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-8 font-display text-3xl text-white sm:text-4xl">
            Ready to create your first poster?
          </h2>
          <Button asChild size="lg" className="text-base">
            <Link href="/auth/signup">Get Started Free</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
