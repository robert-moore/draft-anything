'use client'

import { GameCard } from '@/components/ui/game-card'
import { ActionButton } from '@/components/ui/action-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Users, Clock, RotateCcw, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function NewDraftPage() {
  const [name, setName] = useState('')
  const [maxDrafters, setMaxDrafters] = useState(4)
  const [secPerRound, setSecPerRound] = useState(60)
  const [numRounds, setNumRounds] = useState(3)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          maxDrafters,
          secPerRound,
          numRounds,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create draft')
      }

      const data = await response.json()
      
      router.push(`/drafts/${data.draft.id}`)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const draftTemplates = [
    {
      title: 'Favorite Movies',
      description: 'Rank the best films of all time',
      icon: '🎬',
      example: 'The Godfather, Pulp Fiction, Citizen Kane...'
    },
    {
      title: 'Best Restaurants',
      description: 'Your local food favorites',
      icon: '🍕',
      example: 'Joe\'s Pizza, Burger Palace, Sushi Central...'
    },
    {
      title: 'Dream Vacation',
      description: 'Places you want to visit',
      icon: '✈️',
      example: 'Paris, Tokyo, Bali, New York...'
    },
    {
      title: 'Music Artists',
      description: 'Your favorite musicians',
      icon: '🎵',
      example: 'The Beatles, Queen, Drake...'
    }
  ]

  return (
    <div className="px-6 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-light tracking-tight">
              Create a New <span className="font-semibold text-primary">Draft</span>
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start a friendly competition and see what your friends think. 
            Perfect for settling debates and discovering preferences.
          </p>
        </div>

        {/* Templates Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            Popular Draft Ideas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {draftTemplates.map((template, index) => (
              <GameCard
                key={index}
                variant="interactive"
                className="text-center cursor-pointer group"
                onClick={() => setName(template.title)}
              >
                <div className="text-2xl mb-3">{template.icon}</div>
                <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                  {template.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {template.description}
                </p>
                <p className="text-xs text-muted-foreground italic">
                  {template.example}
                </p>
              </GameCard>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <GameCard size="lg">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold">Draft Settings</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base font-medium">
                    What are you drafting?
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Best Pizza Places, Favorite Movies, Dream Cars..."
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="text-lg py-3"
                  />
                  <p className="text-sm text-muted-foreground">
                    Be specific! This helps your friends understand what they're ranking.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="maxDrafters" className="text-base font-medium flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Max Players
                    </Label>
                    <Input
                      id="maxDrafters"
                      type="number"
                      min="2"
                      max="20"
                      value={maxDrafters}
                      onChange={e => setMaxDrafters(Number(e.target.value))}
                      required
                      className="text-center font-medium"
                    />
                    <p className="text-xs text-muted-foreground">
                      2-20 players
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secPerRound" className="text-base font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Time per Pick
                    </Label>
                    <Input
                      id="secPerRound"
                      type="number"
                      min="5"
                      max="300"
                      value={secPerRound}
                      onChange={e => setSecPerRound(Number(e.target.value))}
                      required
                      className="text-center font-medium"
                    />
                    <p className="text-xs text-muted-foreground">
                      5-300 seconds
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numRounds" className="text-base font-medium flex items-center gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Rounds
                    </Label>
                    <Input
                      id="numRounds"
                      type="number"
                      min="1"
                      max="10"
                      value={numRounds}
                      onChange={e => setNumRounds(Number(e.target.value))}
                      required
                      className="text-center font-medium"
                    />
                    <p className="text-xs text-muted-foreground">
                      1-10 rounds
                    </p>
                  </div>
                </div>

                {error && (
                  <GameCard variant="highlight" className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                    </div>
                  </GameCard>
                )}

                <ActionButton
                  type="submit"
                  variant="primary"
                  className="w-full py-4 text-lg"
                  loading={isLoading}
                  icon={!isLoading && <Plus className="w-5 h-5" />}
                  disabled={
                    isLoading ||
                    !name.trim() ||
                    maxDrafters < 2 ||
                    secPerRound < 5 ||
                    numRounds < 1
                  }
                >
                  {isLoading ? 'Creating Your Draft...' : 'Create Draft'}
                </ActionButton>
              </form>
            </GameCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <GameCard>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                How it works
              </h3>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">1</div>
                  <div>
                    <p className="font-medium text-foreground">Create your draft</p>
                    <p>Set up the topic and rules</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">2</div>
                  <div>
                    <p className="font-medium text-foreground">Invite friends</p>
                    <p>Share the link with your group</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">3</div>
                  <div>
                    <p className="font-medium text-foreground">Start drafting</p>
                    <p>Take turns picking your favorites</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">4</div>
                  <div>
                    <p className="font-medium text-foreground">See results</p>
                    <p>Compare rankings and debate!</p>
                  </div>
                </div>
              </div>
            </GameCard>

            <GameCard className="bg-gradient-to-br from-primary/5 to-purple-500/5">
              <h3 className="font-semibold mb-3">💡 Pro Tips</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>• Be specific with your draft topic for better results</p>
                <p>• 4-6 players usually works best for engaging discussions</p>
                <p>• 60 seconds gives enough time to think but keeps things moving</p>
                <p>• More rounds = more detailed rankings</p>
              </div>
            </GameCard>

            <GameCard>
              <h3 className="font-semibold mb-3">🎮 Popular Right Now</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Best Streaming Shows</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Hot</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Favorite Snacks</span>
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">New</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Dream Superpowers</span>
                  <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">Fun</span>
                </div>
              </div>
            </GameCard>
          </div>
        </div>
      </div>
    </div>
  )
}