'use client'

import { BrutalistButton } from '@/components/ui/brutalist-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NumberInput } from '@/components/ui/number-input'
import { PageHeader } from '@/components/ui/page-header'
import {
  RadioGroupSegmented,
  RadioGroupSegmentedItem
} from '@/components/ui/radio-group-segmented'
import { Infinity, Timer } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function NewDraftPage() {
  const [name, setName] = useState('')
  const [maxDrafters, setMaxDrafters] = useState(4)
  const [secPerRound, setSecPerRound] = useState(60)
  const [numRounds, setNumRounds] = useState(3)
  const [timerMode, setTimerMode] = useState<'timed' | 'untimed'>('timed')
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          maxDrafters,
          secPerRound,
          numRounds
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create draft')
      }

      const { draft } = await response.json()

      // Redirect to the draft using the GUID
      router.push(`/drafts/${draft.guid}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create draft')
    } finally {
      setIsLoading(false)
    }
  }

  const draftTemplates = [
    {
      id: 'TEMPLATE_001',
      title: 'CINEMA_RANKINGS',
      category: 'ENTERTAINMENT',
      icon: 'MOV',
      sample: ['The Godfather', 'Pulp Fiction', 'Citizen Kane']
    },
    {
      id: 'TEMPLATE_002',
      title: 'FOOD_ESTABLISHMENTS',
      category: 'CULINARY',
      icon: 'EAT',
      sample: ["Joe's Pizza", 'Burger Palace', 'Sushi Central']
    },
    {
      id: 'TEMPLATE_003',
      title: 'TRAVEL_DESTINATIONS',
      category: 'GEOGRAPHIC',
      icon: 'LOC',
      sample: ['Paris', 'Tokyo', 'Bali']
    },
    {
      id: 'TEMPLATE_004',
      title: 'AUDIO_ARTISTS',
      category: 'MUSIC',
      icon: 'SND',
      sample: ['The Beatles', 'Queen', 'Drake']
    }
  ]

  return (
    <div>
      <PageHeader
        title="Create Draft"
        subtitle="Turn any topic into a ranking"
      />

      <div className="px-6 py-12 bg-background">
        <div className="max-w-3xl mx-auto">
          {/* Core Form */}
          <div className="border-2 border-border bg-card p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-foreground">
              Draft Settings
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Topic Input */}
              <div>
                <Label
                  htmlFor="name"
                  className="text-lg font-bold mb-3 block text-foreground"
                >
                  What are you drafting?
                </Label>
                <Input
                  id="name"
                  placeholder="Best Pizza Places, Favorite Movies..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="text-xl py-4 rounded-none border-2 border-border w-full bg-card text-foreground placeholder:text-muted-foreground focus:border-border"
                />
              </div>

              {/* Draft Configuration */}
              <div className="space-y-8">
                {/* Draft Structure */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                    Draft Structure
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <NumberInput
                      id="maxDrafters"
                      label="Max Players"
                      value={maxDrafters}
                      onChange={setMaxDrafters}
                      min={2}
                      max={20}
                    />
                    <NumberInput
                      id="numRounds"
                      label="Rounds"
                      value={numRounds}
                      onChange={setNumRounds}
                      min={1}
                      max={10}
                    />
                  </div>
                </div>

                {/* Timer Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                      Timer Settings
                    </h3>
                    <RadioGroupSegmented
                      value={timerMode}
                      onValueChange={value =>
                        setTimerMode(value as 'timed' | 'untimed')
                      }
                    >
                      <RadioGroupSegmentedItem value="timed" icon={Timer}>
                        Timed
                      </RadioGroupSegmentedItem>
                      <RadioGroupSegmentedItem value="untimed" icon={Infinity}>
                        Untimed
                      </RadioGroupSegmentedItem>
                    </RadioGroupSegmented>
                  </div>

                  {timerMode === 'untimed' ? (
                    <div className="border-2 border-border p-6 text-center">
                      <Infinity className="w-8 h-8 mx-auto mb-2 text-foreground" />
                      <p className="text-sm font-medium text-foreground">
                        No Time Limit
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Players can take as long as they need
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <NumberInput
                        id="secPerRound"
                        label="Seconds per pick"
                        value={secPerRound}
                        onChange={setSecPerRound}
                        min={5}
                        max={300}
                      />
                      <p className="text-xs text-muted-foreground">
                        Auto-pick activates when time expires
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="border-2 border-destructive bg-destructive/10 p-4">
                  <p className="text-destructive font-medium">{error}</p>
                </div>
              )}

              <BrutalistButton
                type="submit"
                variant="primary"
                className="w-full py-4 text-xl font-bold"
                loading={isLoading}
                disabled={
                  isLoading ||
                  !name.trim() ||
                  maxDrafters < 2 ||
                  (timerMode === 'timed' && secPerRound < 5) ||
                  numRounds < 1
                }
              >
                {isLoading ? 'Creating...' : 'Create Draft'}
              </BrutalistButton>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
