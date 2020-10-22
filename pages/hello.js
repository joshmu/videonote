import Hero from '@/components/HelloPage/Hero/Hero'
import Layout from '@/components/Layout/Layout'
import ThemeToggle from '@/components/shared/ThemeToggle/ThemeToggle'

const HelloPage = () => {
  return (
    <Layout>
      <div className='absolute top-0 right-0 z-50 p-4 text-2xl hover:text-themeAccent'>
        <ThemeToggle
          lightColor='text-themeAccent'
          darkColor='text-themeAccent'
        />
      </div>

      <Hero />

      <div className='w-full h-screen bg-gradient-to-r from-themeBg to-themeAccent'></div>
    </Layout>
  )
}

export default HelloPage
