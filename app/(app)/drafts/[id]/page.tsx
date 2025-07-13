'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Clock, Users, Play, Pause, Share2, Copy } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'

interface Draft {
  id: number
  name: string
  draftState: 'setting_up' | 'active' | 'completed' | 'errored' | 'paused' | 'canceled'
  maxDrafters: number
  secPerRound: string
  numRounds: number
  startTime: string
  createdAt: string
}

interface Participant {
  id: string
  name: string
  position: number | null
  isReady: boolean
}

interface DraftPick {
  pickNumber: number
  clientId: string
  clientName: string
  payload: string
  createdAt: string
}

export default function DraftPage() {
  const params = useParams()
  const draftId = params.id as string
  
  const [draft, setDraft] = useState<Draft | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [picks, setPicks] = useState<DraftPick[]>([])
  const [currentPick, setCurrentPick] = useState('')
  const [isJoined, setIsJoined] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentTurn, setCurrentTurn] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInviteLink, setShowInviteLink] = useState(false)
  const [inviteLink, setInviteLink] = useState('')

  // Load draft data and check if already joined
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const response = await fetch(`/api/drafts/${draftId}`)
        if (!response.ok) {
          if (response.status === 401) {
            // Redirect to login with return URL
            window.location.href = `/auth/login?redirectTo=/drafts/${draftId}`
            return
          }
          throw new Error('Failed to load draft')
        }
        const data = await response.json()
        setDraft(data.draft)
        setParticipants(data.participants || [])
        setPicks(data.picks || [])
        setCurrentUser(data.currentUser)
        
        // Check if user is already joined
        if (data.currentUser && data.participants?.some((p: Participant) => p.id === data.currentUser.id)) {
          setIsJoined(true)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load draft')
      } finally {
        setIsLoading(false)
      }
    }

    loadDraft()
  }, [draftId])

  const handleJoinDraft = async () => {
    if (!playerName.trim()) return
    
    try {
      const response = await fetch(`/api/drafts/${draftId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName.trim() })
      })
      
      if (!response.ok) throw new Error('Failed to join draft')
      
      const newParticipant = await response.json()
      setParticipants(prev => [...prev, newParticipant])
      setIsJoined(true)
      setPlayerName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join draft')
    }
  }

  const handleStartDraft = async () => {
    try {
      const response = await fetch(`/api/drafts/${draftId}/start`, {
        method: 'POST'
      })
      
      if (!response.ok) throw new Error('Failed to start draft')
      
      setDraft(prev => prev ? { ...prev, draftState: 'active' } : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start draft')
    }
  }

  const handleMakePick = async () => {
    if (!currentPick.trim()) return
    
    try {
      const response = await fetch(`/api/drafts/${draftId}/pick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          payload: currentPick.trim()
        })
      })
      
      if (!response.ok) throw new Error('Failed to make pick')
      
      const newPick = await response.json()
      setPicks(prev => [...prev, newPick])
      setCurrentPick('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to make pick')
    }
  }

  const getStateColor = (state: Draft['draftState']) => {
    switch (state) {
      case 'setting_up': return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
      case 'active': return 'bg-green-500/20 text-green-600 dark:text-green-400'
      case 'completed': return 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
      case 'paused': return 'bg-orange-500/20 text-orange-600 dark:text-orange-400'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const handleGetInviteLink = async () => {
    try {
      const response = await fetch(`/api/drafts/${draftId}/invite`, {
        method: 'POST'
      })
      
      if (!response.ok) throw new Error('Failed to create invite link')
      
      const data = await response.json()
      setInviteLink(data.inviteLink)
      setShowInviteLink(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invite link')
    }
  }

  const handleShareDraft = async () => {
    if (!inviteLink) {
      await handleGetInviteLink()
      return
    }
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: draft?.name || 'Join my draft',
          text: 'Come join this draft!',
          url: inviteLink
        })
      } catch (err) {
        // Fallback to clipboard
        navigator.clipboard.writeText(inviteLink)
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(inviteLink)
      // You could show a toast here
    }
  }

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink)
    // You could show a toast here
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading draft...</div>
      </div>
    )
  }

  if (error || !draft) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-destructive">{error || 'Draft not found'}</div>
      </div>
    )
  }

  return (
    <div className="px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{draft.name}</CardTitle>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {participants.length}/{draft.maxDrafters} players
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {draft.secPerRound}s per pick
                  </div>
                  <div>
                    {draft.numRounds} rounds
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareDraft}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Badge className={getStateColor(draft.draftState)}>
                  {draft.draftState.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Main Draft Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Join Draft */}
            {!isJoined && draft.draftState === 'setting_up' && (
              <Card>
                <CardHeader>
                  <CardTitle>Join Draft</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Input
                      placeholder="Enter your name"
                      value={playerName}
                      onChange={e => setPlayerName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleJoinDraft()}
                    />
                    <Button 
                      onClick={handleJoinDraft}
                      disabled={!playerName.trim()}
                    >
                      Join
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Invite Others */}
            {isJoined && draft.draftState === 'setting_up' && (
              <Card>
                <CardHeader>
                  <CardTitle>Invite Others</CardTitle>
                </CardHeader>
                <CardContent>
                  {!showInviteLink ? (
                    <Button 
                      onClick={handleGetInviteLink}
                      className="w-full"
                      variant="outline"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Get Invite Link
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          value={inviteLink}
                          readOnly
                        />
                        <Button
                          onClick={handleCopyInviteLink}
                          variant="outline"
                          size="icon"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button 
                        onClick={handleShareDraft}
                        className="w-full"
                        variant="outline"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Link
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Start Draft */}
            {isJoined && draft.draftState === 'setting_up' && participants.length >= 2 && (
              <Card>
                <CardContent className="pt-6">
                  <Button 
                    onClick={handleStartDraft}
                    className="w-full"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Draft
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Current Pick */}
            {draft.draftState === 'active' && isJoined && (
              <Card>
                <CardHeader>
                  <CardTitle>Make Your Pick</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Input
                      placeholder="What are you drafting? (e.g., Pizza Hut, The Godfather, etc.)"
                      value={currentPick}
                      onChange={e => setCurrentPick(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleMakePick()}
                    />
                    <Button 
                      onClick={handleMakePick}
                      disabled={!currentPick.trim()}
                      className="w-full"
                    >
                      Submit Pick
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Draft Results */}
            <Card>
              <CardHeader>
                <CardTitle>Draft Results</CardTitle>
              </CardHeader>
              <CardContent>
                {picks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No picks yet. {draft.draftState === 'setting_up' ? 'Start the draft to begin!' : 'Be the first to pick!'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {picks.map((pick, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm text-muted-foreground">
                          #{pick.pickNumber}
                        </div>
                        <div className="flex-1">
                          <div className="text-foreground">{pick.payload}</div>
                          <div className="text-xs text-muted-foreground">{pick.clientName}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Participants Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Participants</CardTitle>
              </CardHeader>
              <CardContent>
                {participants.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No participants yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {participants.map((participant, index) => (
                      <div 
                        key={participant.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-sm">
                            {participant.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="text-foreground text-sm">{participant.name}</div>
                          {participant.position && (
                            <div className="text-xs text-muted-foreground">Position {participant.position}</div>
                          )}
                        </div>
                        {participant.isReady && (
                          <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 text-xs">Ready</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}