import { Card } from '../ui'

interface StatCardProps {
  title: string
  value: string
  subtitle: string
}

export function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-1" padding="md" role="article">
      <h2 className="font-mono text-label-sm text-light-on-surface-variant">{title}</h2>
      <p className="font-headline text-headline-lg text-light-primary">{value}</p>
      <p className="font-body text-body-sm text-light-on-surface-variant">{subtitle}</p>
    </Card>
  )
}
