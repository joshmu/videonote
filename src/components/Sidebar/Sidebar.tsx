/**
 * @path /src/components/Sidebar/Sidebar.tsx
 *
 * @project videonote
 * @file Sidebar.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Sunday, 20th September 2020
 * @modified Wednesday, 25th November 2020 8:56:56 pm
 * @copyright © 2020 - 2020 MU
 */

import { Variants, motion } from 'framer-motion'
import { useEffect } from 'react'

import { NoteList } from '@/components/NoteList/NoteList'
import { useGlobalContext } from '@/context/globalContext'
import { useResizable } from '@/hooks/useResizable'

import { SidebarFooter } from './SidebarFooter/SidebarFooter'
import { SidebarHeader } from './SidebarHeader/SidebarHeader'

const sidebarVariants: Variants = {
  initial: {
    opacity: 0,
    x: '100%',
  },
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: '100%',
  },
}

export const Sidebar = (props: { [key: string]: any }) => {
  const {
    settings,
    updateSettings,
    sidebarOpen,
    SETTINGS_DEFAULTS,
  } = useGlobalContext()

  const { state: resizeState, handleStartResize } = useResizable({
    initialSize: settings.sidebarWidth,
    defaultSize: SETTINGS_DEFAULTS.sidebarWidth,
  })

  // update sidebar width once resizing completes
  // don't fire if its the initial default values
  useEffect(() => {
    // don't update durting resize
    if (resizeState.resizing) return
    // don't update if we are just setting defaults
    if (resizeState.size === SETTINGS_DEFAULTS.sidebarWidth) return
    // don't update if we are settings the server response
    if (resizeState.size === settings.sidebarWidth) return

    // console.log('updating sidebar width', { resizeState })
    console.log('fire from sidebar')
    updateSettings({ sidebarWidth: resizeState.size })
  }, [resizeState])

  return (
    <motion.div
      key='sidebar'
      initial='initial'
      animate='animate'
      exit='exit'
      variants={sidebarVariants}
      id='sidebar'
      style={{
        width: sidebarOpen ? resizeState.size : 0,
      }}
      className='relative flex flex-col h-auto transition-all duration-500 ease-in-out border-l border-themeText2'
      {...props}
    >
      {/* sidebar edge for resizing */}
      {sidebarOpen && (
        <div
          className='absolute left-0 z-10 w-6 h-full transform -translate-x-4/5'
          style={{ cursor: 'ew-resize' }}
          onMouseDown={handleStartResize}
        ></div>
      )}

      {/* sidebar inner wrapper to maintain width */}
      <div
        style={{ width: resizeState.size + 'px' }}
        className='relative flex flex-col h-full'
      >
        <SidebarHeader />

        {/* sidebar content */}
        <div className='flex-1 w-full h-full overflow-auto scrollbar'>
          <NoteList />
        </div>

        <SidebarFooter />
      </div>
    </motion.div>
  )
}
