import { ArrowRight, Camera, Download, Palette, Sparkles, Trophy, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen bg-surface-950 overflow-hidden">
      {/* Hero Section */}
      <section aria-label="Hero" className="relative min-h-screen">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="absolute inset-0 bg-gradient-to-b from-surface-950 via-transparent to-surface-950" />

        {/* Animated grid background */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="h-full w-full" style={{
            backgroundImage: `linear-gradient(rgba(233, 196, 106, 0.3) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(233, 196, 106, 0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} />
        </div>

        {/* Grain overlay */}
        <div className="grain absolute inset-0" />

        <div className="container-wide relative z-10">
          {/* Navigation */}
          <nav className="flex items-center justify-between py-6">
            <Link href="/" className="group flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500">
                <Trophy className="h-5 w-5 text-surface-950" aria-hidden="true" />
              </div>
              <span className="font-display text-2xl tracking-wider text-white">
                BJJ POSTER
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <Link
                href="/auth/login"
                className="hidden text-sm text-surface-400 transition-colors hover:text-white sm:block"
              >
                Sign in
              </Link>
              <Button asChild size="sm">
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="grid min-h-[85vh] items-center gap-12 py-12 lg:grid-cols-2 lg:gap-20">
            {/* Left Column - Text */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-2 opacity-0 animate-fade-in-up">
                <Sparkles className="h-4 w-4 text-gold-500" aria-hidden="true" />
                <span className="text-sm font-medium text-gold-400">Professional Quality Designs</span>
              </div>

              {/* Headline */}
              <h1 className="opacity-0 animate-fade-in-up stagger-1">
                <span className="block font-display text-5xl tracking-wide text-white sm:text-6xl lg:text-7xl">
                  CHAMPION
                </span>
                <span className="block font-display text-5xl tracking-wide text-gradient-gold sm:text-6xl lg:text-7xl">
                  WORTHY
                </span>
                <span className="block font-display text-5xl tracking-wide text-white sm:text-6xl lg:text-7xl">
                  POSTERS
                </span>
              </h1>

              {/* Description */}
              <p className="max-w-lg text-lg text-surface-400 opacity-0 animate-fade-in-up stagger-2 lg:text-xl">
                Create stunning tournament posters that capture your BJJ journey.
                Professional designs, zero design skills required.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-4 opacity-0 animate-fade-in-up stagger-3 sm:flex-row">
                <Button asChild size="lg" className="group">
                  <Link href="/auth/signup">
                    Start Creating Free
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/builder">View Templates</Link>
                </Button>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-6 pt-4 opacity-0 animate-fade-in-up stagger-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-10 w-10 rounded-full border-2 border-surface-950 bg-surface-700"
                    />
                  ))}
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-white">2,500+</span>
                  <span className="text-surface-500"> athletes creating posters</span>
                </div>
              </div>
            </div>

            {/* Right Column - Poster Showcase */}
            <div className="relative flex h-[500px] items-center justify-center lg:h-[650px]">
              {/* Glow effect behind posters */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-80 w-80 rounded-full bg-gold-500/10 blur-[100px]" />
              </div>

              <div className="relative h-full w-full max-w-lg">
                {/* Back poster */}
                <div className="absolute left-0 top-1/2 h-[280px] w-[200px] -translate-y-1/2 -rotate-12 transform overflow-hidden rounded-xl opacity-0 animate-fade-in stagger-2 shadow-2xl shadow-black/50 transition-all duration-500 hover:scale-105 hover:rotate-[-8deg] sm:h-[380px] sm:w-[280px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-gold-500/20 to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />
                  <Image
                    src="/images/examples/poster-3.svg"
                    alt="Example BJJ tournament poster"
                    fill
                    sizes="(max-width: 640px) 200px, 280px"
                    priority
                    className="object-cover"
                  />
                </div>

                {/* Middle poster (main) */}
                <div className="absolute left-1/2 top-1/2 z-10 h-[320px] w-[230px] -translate-x-1/2 -translate-y-1/2 transform overflow-hidden rounded-xl opacity-0 animate-scale-in stagger-3 shadow-2xl shadow-black/60 ring-1 ring-white/10 transition-all duration-500 hover:scale-[1.03] sm:h-[420px] sm:w-[310px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-gold-500/20 to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />
                  <Image
                    src="/images/examples/poster-1.svg"
                    alt="Example BJJ tournament poster"
                    fill
                    sizes="(max-width: 640px) 230px, 310px"
                    priority
                    className="object-cover"
                  />
                </div>

                {/* Front poster */}
                <div className="absolute right-0 top-1/2 z-20 h-[280px] w-[200px] -translate-y-1/2 rotate-12 transform overflow-hidden rounded-xl opacity-0 animate-fade-in stagger-4 shadow-2xl shadow-black/50 transition-all duration-500 hover:scale-105 hover:rotate-[8deg] sm:h-[380px] sm:w-[280px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-gold-500/20 to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />
                  <Image
                    src="/images/examples/poster-2.svg"
                    alt="Example BJJ tournament poster"
                    fill
                    sizes="(max-width: 640px) 200px, 280px"
                    priority
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 animate-fade-in stagger-6">
          <div className="flex flex-col items-center gap-2 text-surface-500">
            <span className="text-xs tracking-widest uppercase">Scroll</span>
            <div className="h-12 w-px bg-gradient-to-b from-surface-500 to-transparent" />
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="divider-gold" />

      {/* How It Works Section */}
      <section aria-labelledby="how-it-works-heading" className="relative section-padding">
        <div className="container-wide">
          {/* Section Header */}
          <div className="mb-20 text-center">
            <span className="mb-4 inline-block text-sm font-medium uppercase tracking-[0.2em] text-gold-500">
              Simple Process
            </span>
            <h2
              id="how-it-works-heading"
              className="font-display text-4xl tracking-wide text-white sm:text-5xl lg:text-6xl"
            >
              CREATE IN 3 STEPS
            </h2>
          </div>

          {/* Steps Grid */}
          <div className="grid gap-8 md:grid-cols-3 md:gap-6 lg:gap-12">
            {/* Step 1 */}
            <div className="group relative">
              <div className="relative rounded-2xl border border-surface-800 bg-surface-900/50 p-8 transition-all duration-500 hover:border-gold-500/30 hover:bg-surface-900/80">
                {/* Step number */}
                <div className="absolute -top-4 left-8 flex h-8 w-8 items-center justify-center rounded-full bg-gold-500 font-display text-lg text-surface-950">
                  1
                </div>

                {/* Icon */}
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl border border-surface-700 bg-surface-800 transition-all duration-300 group-hover:border-gold-500/50 group-hover:shadow-gold-sm">
                  <Camera className="h-8 w-8 text-gold-500" aria-hidden="true" />
                </div>

                <h3 className="mb-3 font-display text-2xl tracking-wide text-white">
                  UPLOAD PHOTO
                </h3>
                <p className="text-surface-400 leading-relaxed">
                  Add your athlete photo or choose from your gallery. We support all major image formats.
                </p>
              </div>

              {/* Connector line (hidden on mobile) */}
              <div className="absolute right-0 top-1/2 hidden h-px w-8 -translate-y-1/2 translate-x-full bg-gradient-to-r from-surface-700 to-transparent md:block lg:w-12" />
            </div>

            {/* Step 2 */}
            <div className="group relative">
              <div className="relative rounded-2xl border border-surface-800 bg-surface-900/50 p-8 transition-all duration-500 hover:border-gold-500/30 hover:bg-surface-900/80">
                <div className="absolute -top-4 left-8 flex h-8 w-8 items-center justify-center rounded-full bg-gold-500 font-display text-lg text-surface-950">
                  2
                </div>

                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl border border-surface-700 bg-surface-800 transition-all duration-300 group-hover:border-gold-500/50 group-hover:shadow-gold-sm">
                  <Palette className="h-8 w-8 text-gold-500" aria-hidden="true" />
                </div>

                <h3 className="mb-3 font-display text-2xl tracking-wide text-white">
                  CHOOSE TEMPLATE
                </h3>
                <p className="text-surface-400 leading-relaxed">
                  Pick from professionally designed tournament layouts crafted for BJJ athletes.
                </p>
              </div>

              <div className="absolute right-0 top-1/2 hidden h-px w-8 -translate-y-1/2 translate-x-full bg-gradient-to-r from-surface-700 to-transparent md:block lg:w-12" />
            </div>

            {/* Step 3 */}
            <div className="group relative">
              <div className="relative rounded-2xl border border-surface-800 bg-surface-900/50 p-8 transition-all duration-500 hover:border-gold-500/30 hover:bg-surface-900/80">
                <div className="absolute -top-4 left-8 flex h-8 w-8 items-center justify-center rounded-full bg-gold-500 font-display text-lg text-surface-950">
                  3
                </div>

                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl border border-surface-700 bg-surface-800 transition-all duration-300 group-hover:border-gold-500/50 group-hover:shadow-gold-sm">
                  <Download className="h-8 w-8 text-gold-500" aria-hidden="true" />
                </div>

                <h3 className="mb-3 font-display text-2xl tracking-wide text-white">
                  DOWNLOAD & SHARE
                </h3>
                <p className="text-surface-400 leading-relaxed">
                  Export high-quality images ready for print, social media, or your gym wall.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative border-y border-surface-800 bg-surface-900/30">
        <div className="container-wide">
          <div className="grid grid-cols-2 divide-x divide-surface-800 md:grid-cols-4">
            {[
              { value: '10K+', label: 'Posters Created' },
              { value: '2.5K+', label: 'Athletes' },
              { value: '50+', label: 'Templates' },
              { value: '4.9', label: 'Rating' },
            ].map((stat, index) => (
              <div key={index} className="px-4 py-12 text-center md:px-8">
                <div className="font-display text-3xl text-gold-500 sm:text-4xl lg:text-5xl">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-surface-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative section-padding">
        <div className="container-wide">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Left - Feature List */}
            <div className="space-y-8">
              <span className="mb-4 inline-block text-sm font-medium uppercase tracking-[0.2em] text-gold-500">
                Why Choose Us
              </span>
              <h2 className="font-display text-4xl tracking-wide text-white sm:text-5xl">
                BUILT FOR<br />
                <span className="text-gradient-gold">CHAMPIONS</span>
              </h2>

              <div className="space-y-6 pt-4">
                {[
                  {
                    icon: Trophy,
                    title: 'Competition Ready',
                    description: 'Designs that capture the intensity and prestige of tournament competition.',
                  },
                  {
                    icon: Users,
                    title: 'Team Branding',
                    description: 'Add your academy logo and colors to represent your team with pride.',
                  },
                  {
                    icon: Sparkles,
                    title: 'Professional Quality',
                    description: 'High-resolution exports perfect for printing banners, social media, and more.',
                  },
                ].map((feature, index) => (
                  <div key={index} className="group flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-surface-700 bg-surface-800 transition-all duration-300 group-hover:border-gold-500/50">
                      <feature.icon className="h-5 w-5 text-gold-500" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-white">{feature.title}</h3>
                      <p className="text-sm text-surface-400 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Image/Visual */}
            <div className="relative">
              <div className="relative aspect-square rounded-2xl border border-surface-800 bg-surface-900/50 p-8">
                {/* Decorative elements */}
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gold-500/10 blur-2xl" />
                <div className="absolute -bottom-4 -left-4 h-32 w-32 rounded-full bg-gold-500/5 blur-3xl" />

                {/* Placeholder for feature image */}
                <div className="relative h-full w-full overflow-hidden rounded-xl bg-surface-800">
                  <div className="flex h-full items-center justify-center">
                    <Trophy className="h-32 w-32 text-surface-700" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section aria-labelledby="cta-heading" className="relative section-padding overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-surface-950 via-gold-500/5 to-surface-950" />

        <div className="container-tight relative z-10">
          <div className="rounded-3xl border border-gold-500/20 bg-surface-900/80 p-8 text-center backdrop-blur-xl sm:p-12 lg:p-16">
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-gold-500/10 via-transparent to-transparent" />

            <div className="relative">
              <h2
                id="cta-heading"
                className="mb-6 font-display text-4xl tracking-wide text-white sm:text-5xl lg:text-6xl"
              >
                READY TO CREATE YOUR
                <br />
                <span className="text-gradient-gold">CHAMPIONSHIP POSTER?</span>
              </h2>

              <p className="mx-auto mb-8 max-w-xl text-lg text-surface-400">
                Join thousands of BJJ athletes showcasing their achievements with professional quality posters.
              </p>

              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button asChild size="xl" className="group">
                  <Link href="/auth/signup">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </Button>
                <span className="text-sm text-surface-500">No credit card required</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-800 bg-surface-950">
        <div className="container-wide py-12">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500">
                <Trophy className="h-4 w-4 text-surface-950" aria-hidden="true" />
              </div>
              <span className="font-display text-xl tracking-wider text-white">BJJ POSTER</span>
            </Link>

            <div className="flex items-center gap-6 text-sm text-surface-500">
              <Link href="/pricing" className="transition-colors hover:text-white">Pricing</Link>
              <Link href="#" className="transition-colors hover:text-white">Privacy</Link>
              <Link href="#" className="transition-colors hover:text-white">Terms</Link>
            </div>

            <p className="text-sm text-surface-600">
              {new Date().getFullYear()} BJJ Poster Builder
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
