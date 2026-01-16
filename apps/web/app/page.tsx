'use client';

import { ArrowRight, Camera, Crown, Download, Palette, Rocket, Sparkles, Trophy, Users, Star, Zap, Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { BJJBeltHero, BeltIcon, BeltRankIndicator, BeltStripe } from '@/components/ui/bjj-belt';
import {
  PageTransition,
  FadeUp,
  SlideLeft,
  SlideRight,
  StaggerContainer,
  StaggerItem,
  ScrollProgress,
  MagneticHover,
  AnimatedCounter,
  BlurReveal,
  motion,
} from '@/components/ui/motion';
import { easings } from '@/lib/animations';

export default function Home() {
  return (
    <PageTransition>
      <ScrollProgress />
      <main id="main-content" className="min-h-screen bg-surface-950 overflow-hidden">
        {/* Hero Section - Championship Stage */}
        <section aria-label="Hero" className="relative min-h-screen">
          {/* Animated BJJ Belt Background - tightens as you scroll */}
          <BJJBeltHero color="black" animated />

          {/* Subtle gold spotlight from above */}
          <div className="absolute inset-0 bg-gradient-to-b from-gold-500/5 via-transparent to-transparent pointer-events-none" />

          {/* Grain texture for premium feel */}
          <div className="grain absolute inset-0 pointer-events-none" />

          <div className="container-wide relative z-10">
            {/* Navigation */}
            <motion.nav
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easings.easeOut }}
              className="flex items-center justify-between py-6"
            >
              <Link href="/" className="group flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 shadow-lg shadow-gold-500/20"
                >
                  <Trophy className="h-6 w-6 text-surface-950" aria-hidden="true" />
                </motion.div>
                <div className="flex flex-col">
                  <span className="font-display text-2xl tracking-wider text-white">
                    BJJ POSTER
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-gold-500/70">Championship Designs</span>
                </div>
              </Link>

              <div className="flex items-center gap-6">
                <Link
                  href="/pricing"
                  className="hidden text-sm font-medium text-surface-300 transition-colors hover:text-gold-400 sm:block"
                >
                  Pricing
                </Link>
                <Link
                  href="/auth/login"
                  className="hidden text-sm text-surface-400 transition-colors hover:text-gold-400 sm:block"
                >
                  Sign in
                </Link>
                <MagneticHover strength={0.2}>
                  <Button asChild size="sm" className="btn-premium bg-gold-500 text-surface-950 hover:bg-gold-400">
                    <Link href="/auth/signup">Get Started</Link>
                  </Button>
                </MagneticHover>
              </div>
            </motion.nav>

            {/* Hero Content */}
            <div className="grid min-h-[85vh] items-center gap-12 py-12 lg:grid-cols-2 lg:gap-16">
              {/* Left Column - Text */}
              <div className="space-y-8">
                {/* Belt rank indicator */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <BeltRankIndicator currentRank="black" className="mb-4" />
                </motion.div>

                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3, ease: easings.elastic }}
                  className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-2"
                >
                  <BeltStripe stripes={3} className="h-3" />
                  <span className="text-sm font-medium text-gold-400">Competition-Ready Designs</span>
                </motion.div>

                {/* Headline - Dramatic and Bold */}
                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-shadow-dramatic"
                >
                  <motion.span
                    initial={{ opacity: 0, x: -60 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, delay: 0.5, ease: easings.easeOut }}
                    className="block font-display text-6xl tracking-wide text-white sm:text-7xl lg:text-8xl"
                  >
                    EARN YOUR
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0, x: -60 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, delay: 0.6, ease: easings.easeOut }}
                    className="block font-display text-6xl tracking-wide sm:text-7xl lg:text-8xl"
                  >
                    <span className="text-gradient-gold text-glow-gold">LEGACY</span>
                  </motion.span>
                </motion.h1>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8, ease: easings.easeOut }}
                  className="max-w-lg text-lg text-surface-300 lg:text-xl leading-relaxed"
                >
                  Transform your tournament victories into{' '}
                  <span className="text-gold-400 font-medium">legendary poster art</span>.
                  Capture the moment you stepped on the mat and proved yourself.
                </motion.p>

                {/* CTA Buttons - No annoying continuous glow */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.9, ease: easings.easeOut }}
                  className="flex flex-col gap-4 sm:flex-row"
                >
                  <MagneticHover strength={0.15}>
                    <Button asChild size="lg" className="group btn-premium bg-gold-500 text-surface-950 hover:bg-gold-400 hover:shadow-gold-lg transition-all duration-300">
                      <Link href="/auth/signup">
                        Create Your Poster
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                      </Link>
                    </Button>
                  </MagneticHover>
                  <Button asChild variant="outline" size="lg" className="border-surface-700 hover:border-gold-500/50 hover:bg-gold-500/5">
                    <Link href="/builder">View Templates</Link>
                  </Button>
                </motion.div>

                {/* Social Proof with Belt Knot */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1, ease: easings.easeOut }}
                  className="flex items-center gap-6 pt-4"
                >
                  <div className="flex items-center gap-3">
                    <BeltIcon size="md" />
                    <div className="text-sm">
                      <span className="font-display text-2xl text-gold-400">2,500+</span>
                      <span className="block text-surface-500">champions creating</span>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-surface-800" />
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-gold-500 text-gold-500" />
                    ))}
                    <span className="ml-2 text-sm text-surface-400">4.9/5</span>
                  </div>
                </motion.div>
              </div>

              {/* Right Column - Poster Showcase */}
              <div className="relative flex h-[500px] items-center justify-center lg:h-[600px]">
                {/* Subtle glow behind posters */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className="h-80 w-80 rounded-full bg-gradient-radial from-gold-500/12 via-gold-500/4 to-transparent blur-[100px]" />
                </motion.div>

                {/* Poster Display - Stacked cascade arrangement */}
                <div className="relative w-full max-w-[420px] h-full flex items-center justify-center">
                  {/* Back poster - offset to the left and up */}
                  <motion.div
                    initial={{ opacity: 0, y: 40, rotate: -12 }}
                    animate={{ opacity: 1, y: 0, rotate: -6 }}
                    transition={{ duration: 0.9, delay: 0.6, ease: easings.easeOut }}
                    whileHover={{ scale: 1.02, rotate: -4, y: -5, transition: { duration: 0.3 } }}
                    className="absolute left-0 top-[15%] h-[320px] w-[230px] sm:h-[400px] sm:w-[285px] overflow-hidden rounded-xl shadow-2xl shadow-black/50 border border-surface-700/30"
                  >
                    <Image
                      src="/images/examples/poster-1.svg"
                      alt="Example BJJ tournament poster featuring a champion"
                      fill
                      sizes="(max-width: 640px) 230px, 285px"
                      priority
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  </motion.div>

                  {/* Front poster - offset to the right and down, featured */}
                  <motion.div
                    initial={{ opacity: 0, y: 60, rotate: 8 }}
                    animate={{ opacity: 1, y: 0, rotate: 3 }}
                    transition={{ duration: 0.9, delay: 0.8, ease: easings.easeOut }}
                    whileHover={{ scale: 1.04, rotate: 1, y: -8, transition: { duration: 0.3 } }}
                    className="absolute right-0 bottom-[12%] h-[340px] w-[245px] sm:h-[420px] sm:w-[300px] overflow-hidden rounded-xl ring-2 ring-gold-500/30 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]"
                  >
                    <Image
                      src="/images/examples/poster-2.svg"
                      alt="Example BJJ tournament poster featuring competition victory"
                      fill
                      sizes="(max-width: 640px) 245px, 300px"
                      priority
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />
                    {/* Featured badge */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.2, duration: 0.4, ease: easings.elastic }}
                      className="absolute top-4 right-4 rounded-full bg-gold-500 px-3 py-1 text-xs font-bold text-surface-950 shadow-lg"
                    >
                      NEW
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="flex flex-col items-center gap-2 text-surface-500"
            >
              <span className="text-xs tracking-[0.3em] uppercase">Scroll</span>
              <div className="h-12 w-px bg-gradient-to-b from-gold-500/50 to-transparent" />
            </motion.div>
          </motion.div>
        </section>

        {/* Gold Belt Stripe Divider */}
        <div className="relative h-2 bg-surface-900 overflow-hidden">
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 0.8, ease: easings.easeOut }}
            viewport={{ once: true }}
            className="absolute inset-y-0 left-0 right-0 origin-left bg-gradient-to-r from-transparent via-gold-500 to-transparent"
          />
        </div>

        {/* How It Works Section - The Journey */}
        <section aria-labelledby="how-it-works-heading" className="relative section-padding bg-surface-950">
          {/* Subtle texture */}
          <div className="absolute inset-0 bg-gradient-to-b from-surface-900/30 via-transparent to-surface-900/30" />

          <div className="container-wide relative z-10">
            {/* Section Header */}
            <FadeUp className="mb-20 text-center">
              <span className="mb-4 inline-flex items-center gap-3 text-sm font-medium uppercase tracking-[0.3em] text-gold-500">
                <span className="h-px w-8 bg-gold-500" />
                Your Journey
                <span className="h-px w-8 bg-gold-500" />
              </span>
              <h2
                id="how-it-works-heading"
                className="font-display text-5xl tracking-wide text-white sm:text-6xl lg:text-7xl text-shadow-dramatic"
              >
                THREE STEPS TO
                <br />
                <span className="text-gradient-gold">IMMORTALITY</span>
              </h2>
            </FadeUp>

            {/* Steps Grid */}
            <StaggerContainer staggerDelay={0.15} className="grid gap-8 md:grid-cols-3 md:gap-6 lg:gap-12">
              {/* Step 1 */}
              <StaggerItem>
                <motion.div
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group relative"
                >
                  <div className="card-champion relative p-8 transition-all duration-500 hover:shadow-gold-lg">
                    {/* Step number */}
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="absolute -top-5 left-8 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 font-display text-xl text-surface-950 shadow-lg shadow-gold-500/30"
                    >
                      1
                    </motion.div>

                    {/* Icon */}
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-surface-700 bg-surface-800/50 transition-all duration-300 group-hover:border-gold-500/50 group-hover:shadow-gold-md"
                    >
                      <Camera className="h-10 w-10 text-gold-500" aria-hidden="true" />
                    </motion.div>

                    <h3 className="mb-3 font-display text-2xl tracking-wide text-white">
                      CAPTURE THE MOMENT
                    </h3>
                    <p className="text-surface-400 leading-relaxed">
                      Upload your victory photo. The moment you raised your hand, won the match, earned your medal.
                    </p>
                  </div>

                  {/* Connector line */}
                  <div className="absolute right-0 top-1/2 hidden h-px w-8 -translate-y-1/2 translate-x-full bg-gradient-to-r from-gold-500/50 to-transparent md:block lg:w-12" />
                </motion.div>
              </StaggerItem>

              {/* Step 2 */}
              <StaggerItem>
                <motion.div
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group relative"
                >
                  <div className="card-champion relative p-8 transition-all duration-500 hover:shadow-gold-lg">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="absolute -top-5 left-8 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 font-display text-xl text-surface-950 shadow-lg shadow-gold-500/30"
                    >
                      2
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-surface-700 bg-surface-800/50 transition-all duration-300 group-hover:border-gold-500/50 group-hover:shadow-gold-md"
                    >
                      <Palette className="h-10 w-10 text-gold-500" aria-hidden="true" />
                    </motion.div>

                    <h3 className="mb-3 font-display text-2xl tracking-wide text-white">
                      CHOOSE YOUR STYLE
                    </h3>
                    <p className="text-surface-400 leading-relaxed">
                      Select from championship-worthy templates. Each design tells your story with the respect it deserves.
                    </p>
                  </div>

                  <div className="absolute right-0 top-1/2 hidden h-px w-8 -translate-y-1/2 translate-x-full bg-gradient-to-r from-gold-500/50 to-transparent md:block lg:w-12" />
                </motion.div>
              </StaggerItem>

              {/* Step 3 */}
              <StaggerItem>
                <motion.div
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group relative"
                >
                  <div className="card-champion relative p-8 transition-all duration-500 hover:shadow-gold-lg">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="absolute -top-5 left-8 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 font-display text-xl text-surface-950 shadow-lg shadow-gold-500/30"
                    >
                      3
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-surface-700 bg-surface-800/50 transition-all duration-300 group-hover:border-gold-500/50 group-hover:shadow-gold-md"
                    >
                      <Download className="h-10 w-10 text-gold-500" aria-hidden="true" />
                    </motion.div>

                    <h3 className="mb-3 font-display text-2xl tracking-wide text-white">
                      CLAIM YOUR LEGACY
                    </h3>
                    <p className="text-surface-400 leading-relaxed">
                      Download in stunning resolution. Print it, frame it, hang it on your gym wall. You earned this.
                    </p>
                  </div>
                </motion.div>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </section>

        {/* Stats Section - Gold/Black Theme */}
        <section className="relative border-y border-gold-500/20 bg-surface-900/50 overflow-hidden">
          {/* Subtle gold stripe pattern */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                rgba(212, 175, 55, 1) 0px,
                rgba(212, 175, 55, 1) 1px,
                transparent 1px,
                transparent 60px
              )`
            }}
          />

          <div className="container-wide relative z-10">
            <div className="grid grid-cols-2 divide-x divide-surface-800/50 md:grid-cols-4">
              {[
                { value: 10000, suffix: '+', label: 'Posters Created', icon: Trophy },
                { value: 2500, suffix: '+', label: 'Athletes', icon: Users },
                { value: 50, suffix: '+', label: 'Templates', icon: Palette },
                { value: 4.9, suffix: '', label: 'Rating', icon: Star, isDecimal: true },
              ].map((stat, index) => (
                <FadeUp key={index} delay={index * 0.1} className="group px-4 py-16 text-center md:px-8">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-surface-800/50 group-hover:bg-gold-500/10 transition-colors"
                  >
                    <stat.icon className="h-6 w-6 text-gold-500" />
                  </motion.div>
                  <div className="font-display text-4xl text-gold-500 sm:text-5xl lg:text-6xl">
                    {stat.isDecimal ? (
                      stat.value
                    ) : (
                      <AnimatedCounter target={stat.value} duration={2} />
                    )}
                    {stat.suffix}
                  </div>
                  <div className="mt-2 text-sm text-surface-500 uppercase tracking-wider">{stat.label}</div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section - Pure Gold/Black */}
        <section className="relative section-padding">
          <div className="container-wide">
            <div className="grid items-center gap-16 lg:grid-cols-2">
              {/* Left - Feature List */}
              <SlideLeft className="space-y-8">
                <span className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-[0.3em] text-gold-500">
                  <span className="h-px w-8 bg-gold-500" />
                  Why Champions Choose Us
                </span>
                <h2 className="font-display text-5xl tracking-wide text-white sm:text-6xl text-shadow-dramatic">
                  BUILT FOR
                  <br />
                  <span className="text-gradient-gold">WARRIORS</span>
                </h2>

                <StaggerContainer staggerDelay={0.12} className="space-y-6 pt-4">
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
                    <StaggerItem key={index}>
                      <motion.div
                        whileHover={{ x: 8, transition: { duration: 0.2 } }}
                        className="group flex gap-4"
                      >
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-surface-700 bg-surface-800 transition-all duration-300 group-hover:border-gold-500/50 group-hover:bg-gold-500/10"
                        >
                          <feature.icon className="h-6 w-6 text-gold-500" aria-hidden="true" />
                        </motion.div>
                        <div>
                          <h3 className="mb-1 font-display text-lg text-white">{feature.title}</h3>
                          <p className="text-sm text-surface-400 leading-relaxed">{feature.description}</p>
                        </div>
                      </motion.div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </SlideLeft>

              {/* Right - Visual with realistic Belt Knot */}
              <SlideRight>
                <motion.div
                  whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
                  className="relative aspect-square"
                >
                  {/* Background card */}
                  <div className="absolute inset-0 rounded-3xl border border-surface-800 bg-surface-900/50" />

                  {/* Gold glow decorations */}
                  <motion.div
                    animate={{
                      scale: [1, 1.15, 1],
                      opacity: [0.1, 0.15, 0.1],
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold-500/20 blur-3xl"
                  />
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.1, 0.12, 0.1],
                    }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                    className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-gold-500/10 blur-3xl"
                  />

                  {/* Central belt icon */}
                  <div className="relative flex h-full items-center justify-center p-8">
                    <motion.div
                      animate={{ rotate: [0, 2, -2, 0] }}
                      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <BeltIcon size="xl" className="!h-44 !w-44" />
                    </motion.div>

                    {/* Floating badge elements */}
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute top-12 right-12 rounded-full bg-surface-800 px-4 py-2 text-xs font-medium text-gold-400 border border-gold-500/20"
                    >
                      Championship Quality
                    </motion.div>
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                      className="absolute bottom-16 left-8 rounded-full bg-surface-800 px-4 py-2 text-xs font-medium text-gold-400 border border-gold-500/20"
                    >
                      Print Ready
                    </motion.div>
                  </div>
                </motion.div>
              </SlideRight>
            </div>
          </div>
        </section>

        {/* Pricing Preview Section */}
        <section aria-labelledby="pricing-heading" className="relative section-padding bg-surface-900/30">
          {/* Subtle diagonal stripes */}
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                -45deg,
                rgba(212, 175, 55, 1) 0px,
                rgba(212, 175, 55, 1) 1px,
                transparent 1px,
                transparent 40px
              )`
            }}
          />

          <div className="container-wide relative z-10">
            {/* Section Header */}
            <FadeUp className="mb-16 text-center">
              <span className="mb-4 inline-flex items-center gap-3 text-sm font-medium uppercase tracking-[0.3em] text-gold-500">
                <span className="h-px w-8 bg-gold-500" />
                Choose Your Path
                <span className="h-px w-8 bg-gold-500" />
              </span>
              <h2
                id="pricing-heading"
                className="font-display text-4xl tracking-wide text-white sm:text-5xl lg:text-6xl text-shadow-dramatic"
              >
                SIMPLE, <span className="text-gradient-gold">CHAMPION</span> PRICING
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-surface-400">
                Start free. Upgrade when you're ready to go pro.
              </p>
            </FadeUp>

            {/* Pricing Cards */}
            <StaggerContainer staggerDelay={0.1} className="grid gap-6 md:grid-cols-3 lg:gap-8">
              {/* Free Tier */}
              <StaggerItem>
                <motion.div
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group relative"
                >
                  <div className="card-champion relative h-full p-6 lg:p-8 transition-all duration-500 hover:shadow-gold-lg">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-800 group-hover:bg-gold-500/10 transition-colors">
                      <Zap className="h-6 w-6 text-gold-500" />
                    </div>
                    <h3 className="font-display text-2xl text-white mb-1">FREE</h3>
                    <p className="text-sm text-surface-400 mb-4">Perfect for trying out</p>
                    <div className="mb-6">
                      <span className="font-display text-4xl text-white">$0</span>
                      <span className="text-surface-500">/month</span>
                    </div>
                    <ul className="space-y-3 mb-6">
                      {['2 posters per month', '720p resolution', 'Basic templates'].map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-surface-300">
                          <Check className="h-4 w-4 text-gold-500 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button asChild variant="outline" className="w-full border-surface-700 hover:border-gold-500/50 hover:bg-gold-500/5">
                      <Link href="/auth/signup?plan=free">Get Started Free</Link>
                    </Button>
                  </div>
                </motion.div>
              </StaggerItem>

              {/* Pro Tier - Featured */}
              <StaggerItem>
                <motion.div
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group relative"
                >
                  {/* Popular badge */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3, ease: easings.elastic }}
                    viewport={{ once: true }}
                    className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"
                  >
                    <span className="rounded-full bg-gold-500 px-4 py-1 text-xs font-bold text-surface-950 shadow-lg shadow-gold-500/30">
                      MOST POPULAR
                    </span>
                  </motion.div>
                  <div className="card-champion relative h-full p-6 lg:p-8 transition-all duration-500 ring-2 ring-gold-500/50 hover:shadow-gold-lg">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500/20">
                      <Rocket className="h-6 w-6 text-gold-500" />
                    </div>
                    <h3 className="font-display text-2xl text-white mb-1">PRO</h3>
                    <p className="text-sm text-surface-400 mb-4">For serious athletes</p>
                    <div className="mb-6">
                      <span className="font-display text-4xl text-gold-400">$9.99</span>
                      <span className="text-surface-500">/month</span>
                    </div>
                    <ul className="space-y-3 mb-6">
                      {['20 posters per month', '1080p HD resolution', 'No watermark', 'Background removal'].map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-surface-300">
                          <Check className="h-4 w-4 text-gold-500 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button asChild className="w-full btn-premium bg-gold-500 text-surface-950 hover:bg-gold-400">
                      <Link href="/auth/signup?plan=pro">Start Pro Trial</Link>
                    </Button>
                  </div>
                </motion.div>
              </StaggerItem>

              {/* Premium Tier */}
              <StaggerItem>
                <motion.div
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group relative"
                >
                  <div className="card-champion relative h-full p-6 lg:p-8 transition-all duration-500 hover:shadow-gold-lg">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-800 group-hover:bg-gold-500/10 transition-colors">
                      <Crown className="h-6 w-6 text-gold-500" />
                    </div>
                    <h3 className="font-display text-2xl text-white mb-1">PREMIUM</h3>
                    <p className="text-sm text-surface-400 mb-4">For professionals & teams</p>
                    <div className="mb-6">
                      <span className="font-display text-4xl text-white">$29.99</span>
                      <span className="text-surface-500">/month</span>
                    </div>
                    <ul className="space-y-3 mb-6">
                      {['Unlimited posters', '4K resolution', 'AI backgrounds', 'Priority support'].map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-surface-300">
                          <Check className="h-4 w-4 text-gold-500 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button asChild variant="outline" className="w-full border-surface-700 hover:border-gold-500/50 hover:bg-gold-500/5">
                      <Link href="/auth/signup?plan=premium">Go Premium</Link>
                    </Button>
                  </div>
                </motion.div>
              </StaggerItem>
            </StaggerContainer>

            {/* View full pricing link */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              viewport={{ once: true }}
              className="mt-10 text-center"
            >
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 text-sm text-surface-400 hover:text-gold-400 transition-colors"
              >
                Compare all features
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* CTA Section - Pure Gold/Black */}
        <section aria-labelledby="cta-heading" className="relative section-padding overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-surface-950 via-gold-500/5 to-surface-950" />
          <BJJBeltHero color="gold" animated={false} className="opacity-10" />

          <BlurReveal className="container-tight relative z-10">
            <motion.div
              whileHover={{ scale: 1.01, transition: { duration: 0.3 } }}
              className="card-champion rounded-3xl p-8 text-center backdrop-blur-xl sm:p-12 lg:p-16"
            >
              {/* Subtle glow */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-gold-500/5 via-transparent to-transparent pointer-events-none" />

              <div className="relative">
                <BeltIcon size="lg" className="mx-auto mb-6" />

                <h2
                  id="cta-heading"
                  className="mb-6 font-display text-4xl tracking-wide text-white sm:text-5xl lg:text-6xl text-shadow-dramatic"
                >
                  READY TO CLAIM
                  <br />
                  <span className="text-gradient-gold">YOUR LEGACY?</span>
                </h2>

                <p className="mx-auto mb-8 max-w-xl text-lg text-surface-300">
                  Join thousands of BJJ athletes who have immortalized their victories.
                  Your mat time earned this - now make it eternal.
                </p>

                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <MagneticHover strength={0.15}>
                    <Button asChild size="xl" className="group btn-premium bg-gold-500 text-surface-950 hover:bg-gold-400 hover:shadow-gold-lg transition-all duration-300">
                      <Link href="/auth/signup">
                        Start Creating Free
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                      </Link>
                    </Button>
                  </MagneticHover>
                  <span className="text-sm text-surface-500">No credit card required</span>
                </div>
              </div>
            </motion.div>
          </BlurReveal>
        </section>

        {/* Footer */}
        <footer className="border-t border-surface-800 bg-surface-950">
          <div className="container-wide py-12">
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600">
                  <Trophy className="h-5 w-5 text-surface-950" aria-hidden="true" />
                </div>
                <span className="font-display text-xl tracking-wider text-white">BJJ POSTER</span>
              </Link>

              <div className="flex items-center gap-6 text-sm text-surface-500">
                <Link href="/pricing" className="transition-colors hover:text-gold-400">Pricing</Link>
                <Link href="#" className="transition-colors hover:text-gold-400">Privacy</Link>
                <Link href="#" className="transition-colors hover:text-gold-400">Terms</Link>
              </div>

              <p className="text-sm text-surface-600">
                &copy; {new Date().getFullYear()} BJJ Poster Builder. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </PageTransition>
  );
}
