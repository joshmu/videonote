/**
 * @path /src/components/Sidebar/SidebarHeader/Menu/MenuButton/MenuButton.tsx
 *
 * @project videonote
 * @file MenuButton.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 1st December 2020
 * @modified Tuesday, 1st December 2020 11:45:50 am
 * @copyright © 2020 - 2020 MU
 */

import { MdSettings as MenuIcon } from 'react-icons/md'
import { motion } from 'framer-motion'
import { useGlobalContext } from '@/root/src/context/globalContext'

export const MenuButton = ({ drawAttention }: { drawAttention: boolean }) => {
  // * 'projectsExists' used to animate menu button on initial welcome

  const { toggleMenuOpen } = useGlobalContext()

  const handleMenuClick = (): void => {
    toggleMenuOpen()
  }

  return (
    <motion.div
      whileHover={{ rotate: 90 }}
      className={drawAttention ? '' : 'animate-pulse text-themeAccent'}
    >
      <MenuIcon onClick={handleMenuClick} className='text-2xl' />
    </motion.div>
  )
}
