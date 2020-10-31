import styles from './LoaderStyle.module.scss'

const Loader = () => {
  return (
      <div className={styles.loader}>
        <div className={`${styles.inner} ${styles.one}`}></div>
        <div className={`${styles.inner} ${styles.two}`}></div>
        <div className={`${styles.inner} ${styles.three}`}></div>
      </div>
  )
}

export default Loader
