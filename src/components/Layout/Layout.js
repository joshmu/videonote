import Head from 'next/head'

export default function Layout({ children }) {
  return (
    <>
      <Head>
        <title>VideoNote</title>
      </Head>
      <div className='relative min-h-full overflow-hidden font-sans antialiased transition-colors duration-300 ease-in-out debug-screens'>
        <main>{children}</main>
      </div>
    </>
  )
}
