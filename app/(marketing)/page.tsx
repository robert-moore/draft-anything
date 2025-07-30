import { ExamplesSection } from '@/components/marketing/examples-section'
import { BrutalistButton } from '@/components/ui/brutalist-button'
import { BrutalistCard } from '@/components/ui/brutalist-card'
import { RhythmSpacer } from '@/components/ui/rhythm-spacer'
import { VisualFocus } from '@/components/ui/visual-focus'
import { Heart, Play, Trophy, Users, Zap } from 'lucide-react'
import Link from 'next/link'
import { memo } from 'react'

const HeroSection = memo(() => (
  <section className="relative px-6 pt-24 pb-12 md:pt-32 lg:pt-40">
    <div className="max-w-6xl mx-auto">
      {/* Hero Focus Block - Eye-catching primary content */}
      <VisualFocus
        priority="primary"
        className="text-center mb-16 py-10 lg:py-16 relative overflow-hidden"
      >
        {/* Enhanced grid background with primary gradient */}
        <div className="absolute inset-0">
          {/* Primary color gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-primary/[0.08]" />
          {/* Enhanced grid pattern */}
          <div className="absolute inset-0 opacity-[0.12] bg-[linear-gradient(to_right,hsl(var(--primary))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary))_1px,transparent_1px)] bg-[size:32px_32px]" />
          {/* Secondary grid for depth */}
          <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,hsl(var(--foreground))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground))_1px,transparent_1px)] bg-[size:8px_8px]" />
        </div>

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
            Have fun ranking and debating with friends.
            <br />
            <span className="text-lg md:text-xl opacity-80">
              Simple, fast, and surprisingly addictive.
            </span>
          </p>

          {/* Primary CTA - Maximum visual weight */}
          <div className="flex flex-col gap-4 justify-center">
            <Link href="/new">
              <BrutalistButton
                variant="primary"
                className="px-12 py-4 text-xl font-semibold group"
                icon={
                  <Play className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                }
              >
                <span className="hidden sm:inline">Set Up Your Draft</span>
                <span className="sm:hidden">Set Up Draft</span>
              </BrutalistButton>
            </Link>
            <div className="mt-2">
              <Link href="/join">
                <BrutalistButton
                  variant="secondary"
                  className="px-12 py-4 text-xl font-semibold group"
                  icon={
                    <Users className="w-6 h-6 transition-transform group-hover:scale-110" />
                  }
                >
                  <span className="hidden sm:inline">Join Draft with Code</span>
                  <span className="sm:hidden">Join With Code</span>
                </BrutalistButton>
              </Link>
            </div>
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
            Take turns drafting items and reacting to your favorites. Watch the
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
  <section className="relative px-6 py-20">
    <div className="max-w-5xl mx-auto">
      {/* Final conversion focus - maximum impact */}
      <VisualFocus
        priority="primary"
        className="text-center relative overflow-hidden py-10 lg:py-16"
      >
        {/* Enhanced radial pattern with gradient */}
        <div className="absolute inset-0">
          {/* Primary color gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/[0.02] via-transparent to-primary/[0.06]" />
          {/* Enhanced radial pattern */}
          <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary))_2px,transparent_2px)] bg-[size:24px_24px]" />
          {/* Subtle overlay dots for depth */}
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_30%_70%,hsl(var(--primary))_1px,transparent_1px)] bg-[size:16px_16px]" />
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-full">
          <div className="pt-16">
            <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-8 leading-tight">
              Ready to start{' '}
              <span className="text-primary relative">
                drafting?
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-primary/20 -rotate-1" />
              </span>
            </h2>

            <p className="text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
              Join thousands of friends creating epic rankings and having fun
              together.
            </p>

            {/* Primary conversion action */}
            <div className="flex justify-center mb-16">
              <Link href="/new">
                <BrutalistButton
                  variant="primary"
                  className="px-12 py-5 text-xl font-semibold group"
                  icon={
                    <Heart className="w-6 h-6 transition-transform group-hover:scale-110" />
                  }
                >
                  Get Started
                </BrutalistButton>
              </Link>
            </div>
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
      <HeroSection />
      <ExamplesSection />
      <HowItWorksSection />
      <CTASection />
    </div>
  )
}
