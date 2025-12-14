import { cn } from '@/lib/utils'

interface CodeBlockProps {
  children: React.ReactNode | string
  className?: string
}

const CodeBlock = ({ children, className }: CodeBlockProps) => {
  return <code className={cn('bg-muted rounded px-1 py-0.5 text-xs', className)}>{children}</code>
}

export default CodeBlock
