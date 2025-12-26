import { cn } from '@/lib/utils'

type PickMessageProps = {
  username: string
  pickText: string
}

const PickMessage = ({ username, pickText }: PickMessageProps) => {
  return (
    <div className={cn('flex w-full justify-center py-1')}>
      <div className="text-xs text-muted-foreground italic">
        <span className="font-medium">{username}</span> picked{' '}
        <span className="font-medium">{pickText}</span>
      </div>
    </div>
  )
}

export default PickMessage

