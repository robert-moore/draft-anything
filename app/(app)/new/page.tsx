'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

export default function NewDraftPage() {
  const [name, setName] = useState('')
  const [maxDrafters, setMaxDrafters] = useState(4)
  const [secPerRound, setSecPerRound] = useState(60)
  const [numRounds, setNumRounds] = useState(3)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log({
      name,
      maxDrafters,
      secPerRound,
      numRounds,
      draftState: 'setting_up',
      startTime: new Date().toISOString(),
      createdAt: new Date().toISOString()
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-8 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-light text-white/90 mb-4 tracking-tight">
            Create a New Draft
          </h1>
          <p className="text-lg text-white/60">
            Add items and let people rank or draft them
          </p>
        </div>

        <Card className="bg-white/[0.02] border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white/90">Draft Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white/80">
                  Draft Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Best Pizza Places, Favorite Movies..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxDrafters" className="text-white/80">
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
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secPerRound" className="text-white/80">
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
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numRounds" className="text-white/80">
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
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/20"
                  disabled={
                    !name.trim() ||
                    maxDrafters < 2 ||
                    secPerRound < 5 ||
                    numRounds < 1
                  }
                >
                  Create Draft
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
