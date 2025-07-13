'use client'

import { GlowCard } from '@/components/ui/glow-card'
import { Shuffle, Star, Users, Zap } from 'lucide-react'
import { memo, useState } from 'react'

const HeroSection = memo(() => (
  <section className="relative z-10 px-8 pt-32 pb-24 md:pt-40 lg:pt-48">
    <div className="max-w-4xl mx-auto text-center">
      <h1 className="text-5xl md:text-6xl lg:text-7xl font-light leading-[0.95] tracking-tight text-white/90 mb-8">
        Draft
        <span className="font-medium"> Anything</span>
      </h1>

      <p className="text-xl md:text-2xl text-white/60 mb-12 leading-relaxed max-w-2xl mx-auto">
        Create rankings and drafts for anything imaginable. From your favorite
        restaurants to the months of the year.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <button className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors backdrop-blur-sm border border-white/20">
          Start Drafting
        </button>
        <button className="px-8 py-3 bg-transparent hover:bg-white/5 rounded-lg text-white/70 font-medium transition-colors border border-white/20">
          See Examples
        </button>
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
      icon: <Star className="w-5 h-5" />
    },
    {
      title: 'Best Months',
      items: ['October', 'December', 'June', 'September', 'April'],
      votes: ['92%', '81%', '70%', '59%', '48%'],
      icon: <Shuffle className="w-5 h-5" />
    },
    {
      title: 'Programming Languages',
      items: ['TypeScript', 'Python', 'Rust', 'Go', 'JavaScript'],
      votes: ['84%', '73%', '62%', '51%', '40%'],
      icon: <Zap className="w-5 h-5" />
    }
  ]

  return (
    <section className="relative z-10 px-8 py-32 border-t border-white/[0.08]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light text-white/90 mb-6 tracking-tight">
            Draft anything you can think of
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Create rankings, run drafts, and settle debates with friends
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {examples.map((example, index) => (
            <button
              key={index}
              onClick={() => setSelectedExample(index)}
              className={`p-6 rounded-lg border transition-all text-left ${
                selectedExample === index
                  ? 'border-white/30 bg-white/5'
                  : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="text-white/80">{example.icon}</div>
                <h3 className="text-lg font-medium text-white/90">
                  {example.title}
                </h3>
              </div>
              <div className="space-y-2">
                {example.items.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm text-white/40">#{i + 1}</span>
                    <span className="text-sm text-white/60">{item}</span>
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>

        <GlowCard variant="neutral" className="max-w-2xl mx-auto">
          <div className="text-center">
            <h3 className="text-2xl font-medium text-white/90 mb-4">
              {examples[selectedExample].title}
            </h3>
            <div className="space-y-3">
              {examples[selectedExample].items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-white/60 font-medium">
                      #{index + 1}
                    </span>
                    <span className="text-white/80">{item}</span>
                  </div>
                  <div className="text-xs text-white/40">
                    {examples[selectedExample].votes[index]} votes
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlowCard>
      </div>
    </section>
  )
})
ExamplesSection.displayName = 'ExamplesSection'

const HowItWorksSection = memo(() => (
  <section className="relative z-10 px-8 py-32">
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.18] to-transparent"></div>
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-light text-white/90 mb-6 tracking-tight">
          Simple as 1, 2, 3
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <GlowCard className="text-center">
          <div className="relative w-12 h-12 rounded-full mx-auto mb-6 bg-white/[0.02] border border-white/20 flex items-center justify-center">
            <span className="text-xl font-medium text-white/90">1</span>
          </div>
          <h3 className="text-xl font-medium text-white/90 mb-4">
            Create a Draft
          </h3>
          <p className="text-white/60 leading-relaxed">
            Start with any topic you want to rank or draft. Add your items and
            invite friends.
          </p>
        </GlowCard>

        <GlowCard className="text-center">
          <div className="relative w-12 h-12 rounded-full mx-auto mb-6 bg-white/[0.02] border border-white/20 flex items-center justify-center">
            <span className="text-xl font-medium text-white/90">2</span>
          </div>
          <h3 className="text-xl font-medium text-white/90 mb-4">
            Make Your Picks
          </h3>
          <p className="text-white/60 leading-relaxed">
            Take turns drafting items or vote on your favorites. Watch the
            rankings unfold.
          </p>
        </GlowCard>

        <GlowCard className="text-center">
          <div className="relative w-12 h-12 rounded-full mx-auto mb-6 bg-white/[0.02] border border-white/20 flex items-center justify-center">
            <span className="text-xl font-medium text-white/90">3</span>
          </div>
          <h3 className="text-xl font-medium text-white/90 mb-4">
            Share & Debate
          </h3>
          <p className="text-white/60 leading-relaxed">
            Compare results, share your rankings, and settle those friendly
            debates once and for all.
          </p>
        </GlowCard>
      </div>
    </div>
  </section>
))
HowItWorksSection.displayName = 'HowItWorksSection'

const CTASection = memo(() => (
  <section className="relative z-10 px-8 py-32 border-t border-white/[0.08]">
    <div className="max-w-4xl mx-auto text-center">
      <h2 className="text-4xl md:text-5xl font-light text-white/90 mb-6 tracking-tight">
        Ready to start drafting?
      </h2>
      <p className="text-lg text-white/60 mb-12 max-w-2xl mx-auto">
        Join your friends and create the ultimate rankings for anything you can
        imagine.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
        <button className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors backdrop-blur-sm border border-white/20">
          Get Started
        </button>
        <button className="px-8 py-3 bg-transparent hover:bg-white/5 rounded-lg text-white/70 font-medium transition-colors border border-white/20">
          Learn More
        </button>
      </div>

      <div className="flex items-center justify-center gap-8 text-sm text-white/40">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>Made for friends</span>
        </div>
        <div className="h-4 w-px bg-white/20"></div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4" />
          <span>Super simple</span>
        </div>
        <div className="h-4 w-px bg-white/20"></div>
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4" />
          <span>Endless possibilities</span>
        </div>
      </div>
    </div>
  </section>
))
CTASection.displayName = 'CTASection'

export default function DraftAnythingLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <HeroSection />
      <ExamplesSection />
      <HowItWorksSection />
      <CTASection />
    </div>
  )
}
