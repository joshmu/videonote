/**
 * @path /pages/privacy.tsx
 *
 * @project videonote
 * @file privacy.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 14th September 2020
 * @modified Friday, 4th December 2020 11:33:05 am
 * @copyright © 2020 - 2020 MU
 */

import { motion } from 'framer-motion'
import { NextPage } from 'next'

import { Footer } from '@/components/Layout/Footer/Footer'
import { Header } from '@/components/Layout/Header/Header'
import { Layout } from '@/components/Layout/Layout'
import { Heading } from '@/components/shared/Text/Text'
import { ThemeToggle } from '@/components/shared/ThemeToggle/ThemeToggle'

const PrivacyPage: NextPage = () => {
  return (
    <Layout>
      <motion.div
        key='privacyPolicyPage'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className='fixed top-0 right-0 z-50 p-4 text-2xl hover:text-themeAccent'>
          <ThemeToggle
            lightColor='text-themeAccent'
            darkColor='text-themeAccent'
          />
        </div>
        <Header />

        <PrivacyPolicy />

        <Footer />
      </motion.div>
    </Layout>
  )
}

export default PrivacyPage

const PrivacyPolicy = () => {
  return (
    <div className='container max-w-2xl px-4 pt-4 mx-auto'>
      <Heading className='mb-4'>Privacy Policy</Heading>
      <div className='space-y-4'>
        <p>
          Your privacy is important to us. It is VideoNote's policy to respect
          your privacy regarding any information we may collect from you across
          our website,{' '}
          <a
            href='https://videonote.app'
            className='underline text-themeAccent text-bold'
          >
            https://videonote.app
          </a>
          , and other sites we own and operate.
        </p>
        <p>
          We only ask for personal information when we truly need it to provide
          a service to you. We collect it by fair and lawful means, with your
          knowledge and consent. We also let you know why we’re collecting it
          and how it will be used.
        </p>
        <p>
          We only retain collected information for as long as necessary to
          provide you with your requested service. What data we store, we’ll
          protect within commercially acceptable means to prevent loss and
          theft, as well as unauthorized access, disclosure, copying, use or
          modification.
        </p>
        <p>
          We don’t share any personally identifying information publicly or with
          third-parties, except when required to by law.
        </p>
        <p>
          Our website may link to external sites that are not operated by us.
          Please be aware that we have no control over the content and practices
          of these sites, and cannot accept responsibility or liability for
          their respective privacy policies.
        </p>
        <p>
          You are free to refuse our request for your personal information, with
          the understanding that we may be unable to provide you with some of
          your desired services.
        </p>
        <p>
          Your continued use of our website will be regarded as acceptance of
          our practices around privacy and personal information. If you have any
          questions about how we handle user data and personal information, feel
          free to contact us.
        </p>
        <p>This policy is effective as of 1 December 2020.</p>
      </div>
    </div>
  )
}
