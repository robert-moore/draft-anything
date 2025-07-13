'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, X } from 'lucide-react'
import { useState } from 'react'

export default function NewDraftPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [items, setItems] = useState([''])

  const addItem = () => {
    setItems([...items, ''])
  }

  const updateItem = (index: number, value: string) => {
    const newItems = [...items]
    newItems[index] = value
    setItems(newItems)
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement draft creation logic
    console.log({ title, description, items: items.filter(item => item.trim()) })
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
                <Label htmlFor="title" className="text-white/80">
                  Title
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Best Pizza Places, Favorite Movies..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white/80">
                  Description (optional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Add context about what you're ranking..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 min-h-[80px]"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-white/80">Items to Draft</Label>
                
                {items.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Item ${index + 1}`}
                      value={item}
                      onChange={e => updateItem(index, e.target.value)}
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                    />
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="bg-white/5 border-white/20 text-white/70 hover:bg-white/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addItem}
                  className="w-full bg-white/5 border-white/20 text-white/70 hover:bg-white/10"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/20"
                  disabled={!title.trim() || items.filter(item => item.trim()).length < 2}
                >
                  Create Draft
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="bg-white/5 border-white/20 text-white/70 hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}