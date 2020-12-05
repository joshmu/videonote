import { ReactNode } from 'react'

export const HeroTitle = ({
  children,
  className = '',
  onClick = null,
  ...props
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
  props?: { [key: string]: any }
}) => {
  return (
    <h1
      onClick={onClick}
      className={`z-10 font-serif tracking-tight cursor-pointer text-8xl ${className}`}
      {...props}
    >
      {children}
    </h1>
  )
}
