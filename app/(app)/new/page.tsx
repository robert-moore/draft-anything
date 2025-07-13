'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
      
      // Redirect to the draft page (you might want to create this page later)
      router.push(`/drafts/${data.draft.id}`)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="px-8 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-light text-foreground mb-4 tracking-tight">
            Create a New Draft
          </h1>
          <p className="text-lg text-muted-foreground">
            Add items and let people rank or draft them
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Draft Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Draft Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Best Pizza Places, Favorite Movies..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxDrafters">
                    Max Drafters
                  </Label>
                  <Input
                    id="maxDrafters"
                    type="number"
                    min="2"
                    max="20"
                    value={maxDrafters}
                    onChange={e => setMaxDrafters(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secPerRound">
                    Seconds per Round
                  </Label>
                  <Input
                    id="secPerRound"
                    type="number"
                    min="5"
                    max="300"
                    value={secPerRound}
                    onChange={e => setSecPerRound(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numRounds">
                    Number of Rounds
                  </Label>
                  <Input
                    id="numRounds"
                    type="number"
                    min="1"
                    max="10"
                    value={numRounds}
                    onChange={e => setNumRounds(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={
                    isLoading ||
                    !name.trim() ||
                    maxDrafters < 2 ||
                    secPerRound < 5 ||
                    numRounds < 1
                  }
                >
                  {isLoading ? 'Creating Draft...' : 'Create Draft'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
