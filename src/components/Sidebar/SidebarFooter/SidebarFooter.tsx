/**
 * @path /src/components/Sidebar/SidebarFooter/SidebarFooter.tsx
 *
 * @project videonote
 * @file SidebarFooter.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Wednesday, 25th November 2020
 * @modified Wednesday, 25th November 2020 8:47:26 pm
 * @copyright © 2020 - 2020 MU
 */

import { useGlobalContext } from '@/root/src/context/globalContext'
import { ExportNotes } from '@/shared/ExportNotes/ExportNotes'

import { RemoveNotes } from './RemoveNotes/RemoveNotes'

export const SidebarFooter = () => {
  const { admin } = useGlobalContext()

  return (
    <div className='absolute bottom-0 flex items-center justify-between w-full h-8 px-4 border-t bg-themeBg border-themeText2'>
      <ExportNotes />
      {admin && <RemoveNotes />}
    </div>
  )
}
