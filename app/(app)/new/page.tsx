'use client'

import { BrutalistCard } from '@/components/ui/brutalist-card'
import { BrutalistButton } from '@/components/ui/brutalist-button'
import { VisualFocus } from '@/components/ui/visual-focus'
import { RhythmSpacer } from '@/components/ui/rhythm-spacer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/ui/page-header'
import { NumberInput } from '@/components/ui/number-input'
import { Plus, Users, Clock, RotateCcw, AlertCircle, Sparkles, ArrowRight, CheckCircle } from 'lucide-react'
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
      sample: ['Joe\'s Pizza', 'Burger Palace', 'Sushi Central']
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
      
      <div className="px-6 py-12 border-t-2 border-black dark:border-white bg-background">
        <div className="max-w-3xl mx-auto">

        {/* Core Form */}
        <div className="border-2 border-black dark:border-white bg-white dark:bg-black p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-black dark:text-white">Draft Settings</h2>
              
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Topic Input */}
            <div>
              <Label htmlFor="name" className="text-lg font-bold mb-3 block text-black dark:text-white">
                What are you drafting?
              </Label>
              <Input
                id="name"
                placeholder="Best Pizza Places, Favorite Movies..."
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="text-xl py-4 rounded-none border-2 border-black dark:border-white w-full bg-white dark:bg-black text-black dark:text-white placeholder:text-muted-foreground focus:border-black dark:focus:border-white"
              />
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-3 gap-6">
              <NumberInput
                id="maxDrafters"
                label="Players"
                value={maxDrafters}
                onChange={setMaxDrafters}
                min={2}
                max={20}
              />
              <NumberInput
                id="secPerRound"
                label="Seconds"
                value={secPerRound}
                onChange={setSecPerRound}
                min={5}
                max={300}
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
                secPerRound < 5 ||
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