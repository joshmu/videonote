/**
 * @path /src/components/shared/Loader/Loader.tsx
 *
 * @project videonote
 * @file Loader.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Saturday, 31st October 2020
 * @modified Friday, 11th December 2020 10:26:23 am
 * @copyright © 2020 - 2020 MU
 */

import { AnimatePresence, Variants, motion } from 'framer-motion'

import styles from './LoaderStyle.module.scss'

const variants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 75, transition: { duration: 0.8 } },
  exit: { opacity: 0 },
}

// @see https://codepen.io/martinvd

export const Loader = ({ show }: { show: boolean }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key='videoLoader'
          initial='initial'
          animate='animate'
          exit='exit'
          variants={variants}
          className='absolute inset-0 z-0 bg-black'
        >
          <div className={styles.loader}>
            <div className={`${styles.inner} ${styles.one}`}></div>
            <div className={`${styles.inner} ${styles.two}`}></div>
            <div className={`${styles.inner} ${styles.three}`}></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
