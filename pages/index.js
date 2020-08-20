import Head from 'next/head'
import Layout from '../src/components/Layout'
import Reveal from '../src/components/Reveal'

export default function Home() {
  return (
    <Layout>
      <Head>
        <title>Next.js Tailwind CSS Starter</title>
      </Head>
      <Reveal>
        <h1 className='p-8 text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500'>
          Next.js Tailwind CSS Starte
          <span className='text-blue-500 uppercase animate-pulse'>r</span>
        </h1>
      </Reveal>
    </Layout>
  )
}
