'use client'

import { BrandLogo } from '@/components/brand/brand-logo'
import { CurrentUserAvatar } from '@/components/current-user-avatar'
import { BrutalistButton } from '@/components/ui/brutalist-button'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { createClient } from '@/lib/supabase/client'
import { formatDistance, parseISO } from 'date-fns'
import { LogOut, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Draft {
  id: number
  guid: string
  name: string
  createdAt: string
  draftState: string
}

interface EmojiReaction {
  emoji: string
  count: number
}

interface UserProfileData {
  drafts: Draft[]
  userEmojiReactions: EmojiReaction[]
  userSelectionEmojiReactions: EmojiReaction[]
}

export function AppHeader() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [profileData, setProfileData] = useState<UserProfileData | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    const getSession = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setIsLoading(false)
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const fetchProfileData = async () => {
    if (!user || profileData) return

    setIsProfileLoading(true)
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setProfileData(data)
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error)
    } finally {
      setIsProfileLoading(false)
    }
  }

  const formatDateAgo = (dateString: string) => {
    // Handle database timestamp format: '2025-07-25 14:36:27.751'
    let date: Date
    if (dateString.includes(' ')) {
      // Database format: '2025-07-25 14:36:27.751'
      date = new Date(dateString.replace(' ', 'T') + 'Z')
    } else {
      // ISO format
      date = parseISO(dateString)
    }

    const now = new Date()

    const distance = formatDistance(date, now, { addSuffix: true })

    // If the date is in the future, it will show "in X", but we want "X ago"
    // This handles cases where the server time might be slightly off
    if (distance.startsWith('in ')) {
      return distance.replace('in ', '') + ' ago'
    }
    return distance
  }

  const getStateInfo = (state: string) => {
    switch (state) {
      case 'setting_up':
        return {
          label: 'Setting Up',
          color: 'bg-blue-500 text-white dark:bg-blue-400 dark:text-black'
        }
      case 'active':
        return {
          label: 'Live',
          color: 'bg-green-500 text-white dark:bg-green-400 dark:text-black'
        }
      case 'challenge_window':
        return {
          label: 'Last Pick Made',
          color: 'bg-yellow-500 text-black dark:bg-yellow-300 dark:text-black'
        }
      case 'challenge':
        return {
          label: 'Challenge',
          color: 'bg-orange-500 text-white dark:bg-orange-400 dark:text-black'
        }
      case 'completed':
        return {
          label: 'Done',
          color: 'bg-gray-400 text-white dark:bg-gray-600 dark:text-white'
        }
      case 'paused':
        return {
          label: 'Paused',
          color: 'bg-purple-500 text-white dark:bg-purple-400 dark:text-black'
        }
      case 'canceled':
        return {
          label: 'Canceled',
          color: 'bg-gray-500 text-white dark:bg-gray-400 dark:text-black'
        }
      default:
        return {
          label: 'Error',
          color: 'bg-red-500 text-white dark:bg-red-400 dark:text-black'
        }
    }
  }

  if (isLoading) {
    return (
      <header className="bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BrandLogo className="h-8 w-auto" />
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </header>
    )
  }

  // Check if user is a guest (has guest client ID in localStorage)
  const isGuest =
    typeof window !== 'undefined' &&
    !!localStorage.getItem('draft-guest-client-id')

  if (!user && !isGuest) {
    return (
      <header className="bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <BrandLogo className="h-8 w-auto" />
            </Link>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link href="/new">
                <BrutalistButton variant="primary" className="px-4 py-2">
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">New Draft</span>
                </BrutalistButton>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="border-b-2 border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <BrandLogo variant="wordmark" className="h-8 w-auto" />
          </Link>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href={user ? '/new' : '/new'}>
              <BrutalistButton variant="primary" className="px-4 py-2">
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">New Draft</span>
              </BrutalistButton>
            </Link>

            {user ? (
              <DropdownMenu
                onOpenChange={open => {
                  if (open) {
                    fetchProfileData()
                  }
                }}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 border-2 border-border hover:border-primary p-0"
                  >
                    <CurrentUserAvatar />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-80 border-2 border-border rounded-none max-h-[80vh] overflow-y-auto"
                  align="end"
                >
                  {/* User Info */}
                  <div className="flex items-center justify-start gap-2 p-3 border-b-2 border-border">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="w-[280px] truncate text-sm text-muted-foreground">
                        {user?.email || 'User'}
                      </p>
                    </div>
                  </div>

                  {/* Profile Data */}
                  {isProfileLoading ? (
                    <div className="p-3">
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  ) : profileData ? (
                    <div className="p-3 space-y-4">
                      {/* Recent Drafts */}
                      <div>
                        <h3 className="text-sm font-medium text-foreground mb-2">
                          Draft History ({profileData.drafts.length})
                        </h3>
                        <div className="space-y-1 max-h-64 overflow-y-auto">
                          {profileData.drafts.slice(0, 250).map(draft => (
                            <div
                              key={draft.id}
                              className="flex items-center justify-between p-2 border border-border hover:border-primary transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={`/drafts/${draft.guid}`}
                                  className="text-sm font-medium text-foreground hover:underline truncate block"
                                >
                                  {draft.name}
                                </Link>
                                <p className="text-xs text-muted-foreground">
                                  {formatDateAgo(draft.createdAt)}
                                </p>
                              </div>
                              <span
                                className={`px-1 py-0.5 text-xs font-medium rounded ml-2 ${
                                  getStateInfo(draft.draftState).color
                                }`}
                              >
                                {getStateInfo(draft.draftState).label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Emoji Statistics */}
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {/* User's Emoji Reactions */}
                        <div>
                          <h4 className="text-xs font-medium text-foreground mb-1">
                            Reactions Given
                          </h4>
                          <div className="space-y-1">
                            {profileData.userEmojiReactions.map(
                              (reaction, index) => (
                                <div
                                  key={reaction.emoji}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  <span className="text-lg">
                                    {reaction.emoji}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {reaction.count}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>

                        {/* Emoji Reactions on User's Selections */}
                        <div>
                          <h4 className="text-xs font-medium text-foreground mb-1">
                            On Your Picks
                          </h4>
                          <div className="space-y-1">
                            {profileData.userSelectionEmojiReactions.map(
                              (reaction, index) => (
                                <div
                                  key={reaction.emoji}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  <span className="text-lg">
                                    {reaction.emoji}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {reaction.count}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3">
                      <p className="text-sm text-muted-foreground">
                        No profile data available
                      </p>
                    </div>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth/login">
                <BrutalistButton variant="secondary" className="px-6">
                  Sign In
                </BrutalistButton>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
