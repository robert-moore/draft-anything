'use client'

import { BrandLogo } from '@/components/brand/brand-logo'
import { NotebookCard } from '@/components/ui/notebook-card'
import { GeometricButton } from '@/components/ui/geometric-button'
import { DotDivider } from '@/components/ui/dot-divider'
import { JournalHeader } from '@/components/ui/journal-header'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Heart, Play, Star, Trophy, Users, Zap } from 'lucide-react'
import Link from 'next/link'
import { memo, useState } from 'react'

const Header = memo(() => (
  <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 backdrop-blur-md bg-background/80 border-b border-border">
    <div className="max-w-6xl mx-auto flex items-center justify-between">
      <Link href="/" className="flex items-center">
        <BrandLogo variant="wordmark" size="md" />
      </Link>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Link href="/auth/login">
          <GeometricButton variant="secondary" className="px-6">
            Sign In
          </GeometricButton>
        </Link>
      </div>
    </div>
  </header>
))
Header.displayName = 'Header'

const HeroSection = memo(() => (
  <section className="relative px-6 pt-32 pb-20 md:pt-40 lg:pt-48">
    <div className="max-w-5xl mx-auto text-center">
      <div className="space-y-6 mb-12">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tight">
          Draft <span className="font-semibold text-primary">Anything</span>
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
          Create epic rankings and drafts for anything imaginable. From your
          favorite pizza toppings to the best Marvel movies.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
        <Link href="/auth/login">
          <GeometricButton
            variant="primary"
            className="px-8 py-3 text-lg"
            icon={<Play className="w-5 h-5" />}
          >
            Start Drafting
          </GeometricButton>
        </Link>
        <GeometricButton variant="ghost" className="px-8 py-3 text-lg">
          See Examples
        </GeometricButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <Users className="w-5 h-5 text-primary" />
          <span className="font-medium">Made for friends</span>
        </div>
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <Zap className="w-5 h-5 text-primary" />
          <span className="font-medium">Super simple</span>
        </div>
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <Trophy className="w-5 h-5 text-primary" />
          <span className="font-medium">Endless fun</span>
        </div>
      </div>
    </div>
  </section>
))
HeroSection.displayName = 'HeroSection'

const ExamplesSection = memo(() => {
  const [selectedExample, setSelectedExample] = useState(0)

  const examples = [
    {
      title: 'Favorite Restaurants',
      items: [
        'Pizza Palace',
        'Burger Haven',
        'Sushi Central',
        'Taco Town',
        'Pasta Paradise'
      ],
      votes: ['87%', '76%', '65%', '54%', '43%'],
      icon: <Star className="w-5 h-5" />,
      color: 'text-amber-500'
    },
    {
      title: 'Best Marvel Movies',
      items: [
        'Avengers: Endgame',
        'Iron Man',
        'Black Panther',
        'Spider-Man',
        'Thor: Ragnarok'
      ],
      votes: ['92%', '81%', '70%', '59%', '48%'],
      icon: <Trophy className="w-5 h-5" />,
      color: 'text-red-500'
    },
    {
      title: 'Programming Languages',
      items: ['TypeScript', 'Python', 'Rust', 'Go', 'JavaScript'],
      votes: ['84%', '73%', '62%', '51%', '40%'],
      icon: <Zap className="w-5 h-5" />,
      color: 'text-blue-500'
    }
  ]

  return (
    <section className="relative px-6 py-24">
      <div className="max-w-6xl mx-auto">
        <JournalHeader 
          title="Draft anything you can imagine"
          meta="Create rankings, run drafts, and settle debates with friends"
          className="mb-16"
        />

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {examples.map((example, index) => (
            <NotebookCard
              key={index}
              variant={selectedExample === index ? 'lined' : 'default'}
              onClick={() => setSelectedExample(index)}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={example.color}>{example.icon}</div>
                <h3 className="text-lg font-semibold font-mono uppercase tracking-wide">{example.title}</h3>
              </div>
              <div className="space-y-2">
                {example.items.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-6 font-mono">
                      #{i + 1}
                    </span>
                    <span className="text-sm truncate">{item}</span>
                  </div>
                ))}
              </div>
            </NotebookCard>
          ))}
        </div>

        <NotebookCard variant="grid" className="max-w-2xl mx-auto">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className={examples[selectedExample].color}>
                {examples[selectedExample].icon}
              </div>
              <h3 className="text-2xl font-semibold font-mono uppercase tracking-wide">
                {examples[selectedExample].title}
              </h3>
            </div>
            <DotDivider variant="dots" className="mb-6" />
            <div className="space-y-3">
              {examples[selectedExample].items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-border bg-background"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-primary text-lg font-mono">
                      #{index + 1}
                    </span>
                    <span className="font-medium">{item}</span>
                  </div>
                  <div className="text-sm font-medium text-muted-foreground font-mono">
                    {examples[selectedExample].votes[index]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </NotebookCard>
      </div>
    </section>
  )
})
ExamplesSection.displayName = 'ExamplesSection'

const HowItWorksSection = memo(() => (
  <section className="relative px-6 py-24 bg-muted/30">
    <div className="max-w-6xl mx-auto">
      <JournalHeader 
        title="Simple as 1, 2, 3"
        meta="Get started in seconds and draft like a pro"
        className="mb-16"
      />

      <div className="grid md:grid-cols-3 gap-8">
        <NotebookCard variant="margin" className="text-center">
          <div className="w-16 h-16 border-2 border-primary bg-background flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl font-bold text-primary font-mono">1</span>
          </div>
          <h3 className="text-xl font-semibold mb-4 font-mono uppercase tracking-wide">Create a Draft</h3>
          <DotDivider variant="line" className="mb-4" />
          <p className="text-muted-foreground leading-relaxed">
            Start with any topic you want to rank or draft. Add your items and
            invite friends to join the fun.
          </p>
        </NotebookCard>

        <NotebookCard variant="margin" className="text-center">
          <div className="w-16 h-16 border-2 border-primary bg-background flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl font-bold text-primary font-mono">2</span>
          </div>
          <h3 className="text-xl font-semibold mb-4 font-mono uppercase tracking-wide">Make Your Picks</h3>
          <DotDivider variant="line" className="mb-4" />
          <p className="text-muted-foreground leading-relaxed">
            Take turns drafting items or vote on your favorites. Watch the
            rankings unfold in real-time.
          </p>
        </NotebookCard>

        <NotebookCard variant="margin" className="text-center">
          <div className="w-16 h-16 border-2 border-primary bg-background flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl font-bold text-primary font-mono">3</span>
          </div>
          <h3 className="text-xl font-semibold mb-4 font-mono uppercase tracking-wide">Share & Debate</h3>
          <DotDivider variant="line" className="mb-4" />
          <p className="text-muted-foreground leading-relaxed">
            Compare results, share your rankings, and settle those friendly
            debates once and for all.
          </p>
        </NotebookCard>
      </div>
    </div>
  </section>
))
HowItWorksSection.displayName = 'HowItWorksSection'

const CTASection = memo(() => (
  <section className="relative px-6 py-24">
    <div className="max-w-4xl mx-auto text-center">
      <div className="space-y-6 mb-12">
        <h2 className="text-4xl md:text-5xl font-light tracking-tight">
          Ready to start{' '}
          <span className="font-semibold text-primary">drafting?</span>
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Join thousands of friends creating epic rankings and settling debates
          for everything under the sun.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
        <Link href="/auth/login">
          <GeometricButton
            variant="primary"
            className="px-8 py-4 text-lg"
            icon={<Heart className="w-5 h-5" />}
          >
            Get Started Free
          </GeometricButton>
        </Link>
        <GeometricButton variant="ghost" className="px-8 py-4 text-lg">
          Learn More
        </GeometricButton>
      </div>

      <NotebookCard
        variant="lined"
        className="max-w-2xl mx-auto bg-gradient-to-r from-primary/5 to-purple-500/5"
      >
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-4 font-mono uppercase tracking-wide">Join the fun today!</h3>
          <DotDivider variant="dots" className="mb-4" />
          <p className="text-muted-foreground mb-6">
            No credit card required. Start drafting in under 30 seconds.
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500"></div>
              <span className="font-mono">Free forever</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500"></div>
              <span className="font-mono">No setup required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500"></div>
              <span className="font-mono">Instant results</span>
            </div>
          </div>
        </div>
      </NotebookCard>
    </div>
  </section>
))
CTASection.displayName = 'CTASection'

export default function DraftAnythingLanding() {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      <ExamplesSection />
      <HowItWorksSection />
      <CTASection />
    </div>
  )
}
