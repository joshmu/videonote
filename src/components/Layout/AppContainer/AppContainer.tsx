/**
 * @path /src/components/Layout/AppContainer/AppContainer.tsx
 *
 * @project videonote
 * @file AppContainer.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Saturday, 31st October 2020
 * @modified Monday, 30th November 2020 7:58:28 pm
 * @copyright © 2020 - 2020 MU
 */

import { ReactNode } from 'react'

import useTwConfig from '@/hooks/useTwConfig'

export const AppContainer = ({
  children,
  ...props
}: {
  children: ReactNode
  props?: {}
}) => {
  const twConfig = useTwConfig()

  return (
    <div
      className='flex flex-1 w-full h-full bg-opacity-25'
      {...props}
      style={{
        backgroundImage: `radial-gradient(circle farthest-corner at center, ${twConfig.theme.colors.themeSelectOpacity} 0%, ${twConfig.theme.colors.themeBg} 100%)`,
      }}
    >
      {children}
    </div>
  )
}
