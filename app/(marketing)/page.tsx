'use client'

import { BrandLogo } from '@/components/brand/brand-logo'
import { BrutalistButton } from '@/components/ui/brutalist-button'
import { BrutalistCard } from '@/components/ui/brutalist-card'
import { RhythmSpacer } from '@/components/ui/rhythm-spacer'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { VisualFocus } from '@/components/ui/visual-focus'
import {
  ArrowRight,
  Heart,
  Play,
  Sparkles,
  Star,
  Trophy,
  Users,
  Zap
} from 'lucide-react'
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
          <BrutalistButton variant="secondary" className="px-6">
            Sign In
          </BrutalistButton>
        </Link>
      </div>
    </div>
  </header>
))
Header.displayName = 'Header'

const HeroSection = memo(() => (
  <section className="relative px-6 pt-24 pb-12 md:pt-32 lg:pt-40">
    <div className="max-w-6xl mx-auto">
      {/* Hero Focus Block - Eye-catching primary content */}
      <VisualFocus
        priority="primary"
        className="text-center mb-16 py-10 lg:py-16 relative overflow-hidden"
      >
        {/* Subtle grid background for texture */}
        <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,hsl(var(--foreground))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground))_1px,transparent_1px)] bg-[size:40px_40px]" />

        <div className="relative z-10">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 leading-none">
            Draft{' '}
            <span className="text-primary relative">
              Anything
              {/* Subtle underline accent */}
              <div className="absolute bottom-2 left-0 right-0 h-1 bg-primary/20" />
            </span>
          </h1>

          <p className="text-2xl md:text-3xl text-muted-foreground leading-relaxed max-w-4xl mx-auto mb-12">
            Create rankings and settle debates with friends.
            <br />
            <span className="text-lg md:text-xl opacity-80">
              Simple, fast, and surprisingly addictive.
            </span>
          </p>

          {/* Primary CTA - Maximum visual weight */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/auth/login">
              <BrutalistButton
                variant="primary"
                className="px-12 py-4 text-xl font-semibold group"
                icon={
                  <Play className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                }
              >
                Start Drafting
              </BrutalistButton>
            </Link>
            <BrutalistButton variant="ghost" className="px-8 py-4 text-lg">
              See Examples
              <ArrowRight className="w-4 h-4 ml-2" />
            </BrutalistButton>
          </div>
        </div>
      </VisualFocus>

      <RhythmSpacer size="lg" />

      {/* Trust indicators - Secondary visual weight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <VisualFocus priority="tertiary" className="text-center py-8">
          <Users className="w-8 h-8 text-primary mx-auto mb-3" />
          <span className="font-semibold text-lg">Made for friends</span>
          <p className="text-sm text-muted-foreground mt-1">
            Bring people together
          </p>
        </VisualFocus>
        <VisualFocus priority="tertiary" className="text-center py-8">
          <Zap className="w-8 h-8 text-primary mx-auto mb-3" />
          <span className="font-semibold text-lg">Super simple</span>
          <p className="text-sm text-muted-foreground mt-1">
            No learning curve
          </p>
        </VisualFocus>
        <VisualFocus priority="tertiary" className="text-center py-8">
          <Trophy className="w-8 h-8 text-primary mx-auto mb-3" />
          <span className="font-semibold text-lg">Endless fun</span>
          <p className="text-sm text-muted-foreground mt-1">
            Hours of entertainment
          </p>
        </VisualFocus>
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
      description: 'Where should we eat tonight?',
      items: [
        'Pizza Palace',
        'Burger Haven',
        'Sushi Central',
        'Taco Town',
        'Pasta Paradise'
      ],
      votes: ['87%', '76%', '65%', '54%', '43%'],
      icon: <Star className="w-6 h-6" />,
      color: 'text-primary'
    },
    {
      title: 'Best Marvel Movies',
      description: 'The definitive superhero ranking',
      items: [
        'Avengers: Endgame',
        'Iron Man',
        'Black Panther',
        'Spider-Man',
        'Thor: Ragnarok'
      ],
      votes: ['92%', '81%', '70%', '59%', '48%'],
      icon: <Trophy className="w-6 h-6" />,
      color: 'text-primary'
    },
    {
      title: 'Programming Languages',
      description: 'What should we learn next?',
      items: ['TypeScript', 'Python', 'Rust', 'Go', 'JavaScript'],
      votes: ['84%', '73%', '62%', '51%', '40%'],
      icon: <Zap className="w-6 h-6" />,
      color: 'text-primary'
    }
  ]

  return (
    <section className="relative px-6 py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        {/* Section header with intentional restraint */}
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight leading-tight">
            Draft anything you can{' '}
            <span className="text-primary relative">
              imagine
              <Sparkles className="absolute -top-2 -right-8 w-6 h-6 text-primary/40" />
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            From movie nights to menu choices, create rankings that actually
            matter to you and your friends
          </p>
        </div>

        {/* Interactive example selector - draws eye with hover states */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {examples.map((example, index) => (
            <VisualFocus
              key={index}
              priority={selectedExample === index ? 'primary' : 'secondary'}
              onClick={() => setSelectedExample(index)}
              className="cursor-pointer transition-all duration-300 hover:scale-105 group"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className={`${example.color} p-2 border-2 border-current`}>
                  {example.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {example.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {example.description}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {example.items.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-6 h-6 border border-border flex items-center justify-center text-xs font-medium">
                      {i + 1}
                    </div>
                    <span className="truncate flex-1">{item}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {example.votes[i]}
                    </span>
                  </div>
                ))}
              </div>

              {selectedExample !== index && (
                <div className="mt-4 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to view full ranking →
                </div>
              )}
            </VisualFocus>
          ))}
        </div>

        {/* Featured example - maximum visual prominence */}
        <VisualFocus
          priority="primary"
          direction="horizontal"
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div
                className={`${examples[selectedExample].color} transition-transform duration-300 ease-out hover:scale-110`}
              >
                {examples[selectedExample].icon}
              </div>
              <h3 className="text-3xl font-bold transition-colors duration-300">
                {examples[selectedExample].title}
              </h3>
            </div>
            <p className="text-lg text-muted-foreground">
              {examples[selectedExample].description}
            </p>
          </div>

          <RhythmSpacer size="sm" variant="dots" />

          <div className="grid gap-4">
            {examples[selectedExample].items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-6 border-2 border-border bg-background/50 hover:bg-background transition-all duration-300 ease-out hover:translate-x-1 hover:shadow-[2px_2px_0px_0px_hsl(var(--border))]"
              >
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 border-2 border-primary bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                    {index + 1}
                  </div>
                  <span className="text-lg font-medium">{item}</span>
                </div>
                <div className="text-lg font-bold text-muted-foreground font-mono">
                  {examples[selectedExample].votes[index]}
                </div>
              </div>
            ))}
          </div>
        </VisualFocus>
      </div>
    </section>
  )
})
ExamplesSection.displayName = 'ExamplesSection'

const HowItWorksSection = memo(() => (
  <section className="relative px-6 py-24 bg-muted/30">
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
          Simple as <span className="text-primary">1, 2, 3</span>
        </h2>
        <p className="text-xl text-muted-foreground">
          Get started in seconds and draft like a pro
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <BrutalistCard className="text-center">
          <div className="w-16 h-16 border-2 border-primary bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl font-bold text-primary">1</span>
          </div>
          <h3 className="text-xl font-semibold mb-4">Create a Draft</h3>
          <p className="text-muted-foreground leading-relaxed">
            Start with any topic you want to rank or draft. Add your items and
            invite friends to join the fun.
          </p>
        </BrutalistCard>

        <BrutalistCard className="text-center">
          <div className="w-16 h-16 border-2 border-primary bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl font-bold text-primary">2</span>
          </div>
          <h3 className="text-xl font-semibold mb-4">Make Your Picks</h3>
          <p className="text-muted-foreground leading-relaxed">
            Take turns drafting items or vote on your favorites. Watch the
            rankings unfold in real-time.
          </p>
        </BrutalistCard>

        <BrutalistCard className="text-center">
          <div className="w-16 h-16 border-2 border-primary bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl font-bold text-primary">3</span>
          </div>
          <h3 className="text-xl font-semibold mb-4">Share & Debate</h3>
          <p className="text-muted-foreground leading-relaxed">
            Compare results, share your rankings, and settle those friendly
            debates once and for all.
          </p>
        </BrutalistCard>
      </div>
    </div>
  </section>
))
HowItWorksSection.displayName = 'HowItWorksSection'

const CTASection = memo(() => (
  <section className="relative px-6 py-32">
    <div className="max-w-5xl mx-auto">
      {/* Final conversion focus - maximum impact */}
      <VisualFocus
        priority="primary"
        className="text-center relative overflow-hidden py-10 lg:py-16"
      >
        {/* Subtle background pattern for texture */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary))_1px,transparent_1px)] bg-[size:30px_30px]" />

        <div className="relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-8 leading-tight">
            Ready to start{' '}
            <span className="text-primary relative">
              drafting?
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-primary/20 -rotate-1" />
            </span>
          </h2>

          <p className="text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
            Join thousands of friends creating epic rankings and settling
            debates for everything under the sun.
          </p>

          {/* Primary conversion action */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link href="/auth/login">
              <BrutalistButton
                variant="primary"
                className="px-12 py-5 text-xl font-semibold group"
                icon={
                  <Heart className="w-6 h-6 transition-transform group-hover:scale-110" />
                }
              >
                Get Started Free
              </BrutalistButton>
            </Link>
            <BrutalistButton variant="ghost" className="px-8 py-5 text-lg">
              Learn More
              <ArrowRight className="w-5 h-5 ml-2" />
            </BrutalistButton>
          </div>

          {/* Simple, elegant closing statement */}
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-lg text-muted-foreground leading-relaxed">
              Free to use. No signup required.{' '}
              <span className="text-foreground font-medium">
                Start creating in seconds.
              </span>
            </p>
          </div>
        </div>
      </VisualFocus>
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
