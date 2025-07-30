import { MarketingClientWrapper } from './client-wrapper'

export default function MarketingLayout({
  children
}: {
  children: React.ReactNode
}) {
  return <MarketingClientWrapper>{children}</MarketingClientWrapper>
}
