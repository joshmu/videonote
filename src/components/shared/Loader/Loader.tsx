/**
 * @path /src/components/shared/Loader/Loader.tsx
 * 
 * @project videonote
 * @file Loader.tsx
 * 
 * @author Josh Mu <hello@joshmu.dev>
 * @created Saturday, 31st October 2020
 * @modified Sunday, 22nd November 2020 3:20:16 pm
 * @copyright © 2020 - 2020 MU
 */

import styles from './LoaderStyle.module.scss'

// @see https://codepen.io/martinvd
export const Loader = () => {
  return (
    <div className={styles.loader}>
      <div className={`${styles.inner} ${styles.one}`}></div>
      <div className={`${styles.inner} ${styles.two}`}></div>
      <div className={`${styles.inner} ${styles.three}`}></div>
    </div>
  )
}
