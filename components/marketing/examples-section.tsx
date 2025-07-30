'use client'

import { RhythmSpacer } from '@/components/ui/rhythm-spacer'
import { VisualFocus } from '@/components/ui/visual-focus'
import { Sparkles, Star, Trophy } from 'lucide-react'
import { memo, useState } from 'react'

export const ExamplesSection = memo(() => {
  const [selectedExample, setSelectedExample] = useState(0)

  const examples = [
    {
      title: 'Best Restaurants Nearby',
      description: 'Top local dining spots',
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
      title: 'Best NBA Players Ever',
      description: 'The GOAT debate continues',
      items: [
        'Michael Jordan',
        'LeBron James',
        'Kareem Abdul-Jabbar',
        'Magic Johnson',
        'Bill Russell'
      ],
      votes: ['84%', '73%', '62%', '51%', '40%'],
      icon: <Trophy className="w-6 h-6" />,
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
            From movie nights to menu choices, create and debate rankings with
            your friends
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
                  </div>
                ))}
              </div>
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
                className="flex items-center justify-between py-8 px-6 border-2 border-border bg-background/50 hover:bg-background transition-all duration-300 ease-out hover:translate-x-1 hover:shadow-[2px_2px_0px_0px_hsl(var(--border))]"
              >
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 border-2 border-primary bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                    {index + 1}
                  </div>
                  <span className="text-lg font-medium">{item}</span>
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
