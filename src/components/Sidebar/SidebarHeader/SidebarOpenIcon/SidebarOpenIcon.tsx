/**
 * @path /src/components/Sidebar/SidebarHeader/SidebarOpenIcon/SidebarOpenIcon.tsx
 *
 * @project videonote
 * @file SidebarOpenIcon.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 1st December 2020
 * @modified Tuesday, 1st December 2020 12:14:27 pm
 * @copyright © 2020 - 2020 MU
 */

import { GoChevronRight as ArrowIcon } from 'react-icons/go'

export const SidebarOpenIcon = ({
  isVisible,
  toggleOpen,
  sidebarOpen,
}: {
  isVisible: boolean
  sidebarOpen: boolean
  toggleOpen: () => void
}) =>
  isVisible && (
    <div
      onClick={toggleOpen}
      className={`relative z-10 transition-all duration-200 ease-in-out cursor-pointer text-themeAccent2 hover:text-themeAccent ${
        sidebarOpen ? '' : 'rotate-180 -translate-x-full transform'
      }`}
    >
      <ArrowIcon className='text-4xl' />
    </div>
  )
