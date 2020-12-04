/**
 * @path /pages/terms.tsx
 *
 * @project videonote
 * @file terms.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 14th September 2020
 * @modified Friday, 4th December 2020 1:33:50 pm
 * @copyright © 2020 - 2020 MU
 */

import { motion } from 'framer-motion'
import { NextPage } from 'next'

import { Footer } from '@/components/Layout/Footer/Footer'
import { Header } from '@/components/Layout/Header/Header'
import { Layout } from '@/components/Layout/Layout'
import { Heading, SubHeading } from '@/components/shared/Text/Text'
import { ThemeToggle } from '@/components/shared/ThemeToggle/ThemeToggle'

const TermsPage: NextPage = () => {
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

        <Terms />

        <Footer />
      </motion.div>
    </Layout>
  )
}

export default TermsPage

const Terms = () => {
  return (
    <div className='container max-w-2xl px-4 pt-4 mx-auto'>
      <Heading className='mb-4'>Terms of Service</Heading>
      <SubHeading className='mt-4 mb-1 font-serif'>1. Terms</SubHeading>
      <p>
        By accessing the website at{' '}
        <a href='https://videonote.app' className='underline text-themeAccent'>
          https://videonote.app
        </a>
        , you are agreeing to be bound by these terms of service, all applicable
        laws and regulations, and agree that you are responsible for compliance
        with any applicable local laws. If you do not agree with any of these
        terms, you are prohibited from using or accessing this site. The
        materials contained in this website are protected by applicable
        copyright and trademark law.
      </p>
      <SubHeading className='mt-4 mb-1 font-serif'>2. Use License</SubHeading>
      <ol type='a'>
        <li>
          Permission is granted to temporarily download one copy of the
          materials (information or software) on VideoNote's website for
          personal, non-commercial transitory viewing only. This is the grant of
          a license, not a transfer of title, and under this license you may
          not:
          <ol type='i'>
            <li>modify or copy the materials;</li>
            <li>
              use the materials for any commercial purpose, or for any public
              display (commercial or non-commercial);
            </li>
            <li>
              attempt to decompile or reverse engineer any software contained on
              VideoNote's website;
            </li>
            <li>
              remove any copyright or other proprietary notations from the
              materials; or
            </li>
            <li>
              transfer the materials to another person or "mirror" the materials
              on any other server.
            </li>
          </ol>
        </li>
        <li>
          This license shall automatically terminate if you violate any of these
          restrictions and may be terminated by VideoNote at any time. Upon
          terminating your viewing of these materials or upon the termination of
          this license, you must destroy any downloaded materials in your
          possession whether in electronic or printed format.
        </li>
      </ol>
      <SubHeading className='mt-4 mb-1 font-serif'>3. Disclaimer</SubHeading>
      <ol type='a'>
        <li>
          The materials on VideoNote's website are provided on an 'as is' basis.
          VideoNote makes no warranties, expressed or implied, and hereby
          disclaims and negates all other warranties including, without
          limitation, implied warranties or conditions of merchantability,
          fitness for a particular purpose, or non-infringement of intellectual
          property or other violation of rights.
        </li>
        <li>
          Further, VideoNote does not warrant or make any representations
          concerning the accuracy, likely results, or reliability of the use of
          the materials on its website or otherwise relating to such materials
          or on any sites linked to this site.
        </li>
      </ol>
      <SubHeading className='mt-4 mb-1 font-serif'>4. Limitations</SubHeading>
      <p>
        In no event shall VideoNote or its suppliers be liable for any damages
        (including, without limitation, damages for loss of data or profit, or
        due to business interruption) arising out of the use or inability to use
        the materials on VideoNote's website, even if VideoNote or a VideoNote
        authorized representative has been notified orally or in writing of the
        possibility of such damage. Because some jurisdictions do not allow
        limitations on implied warranties, or limitations of liability for
        consequential or incidental damages, these limitations may not apply to
        you.
      </p>
      <SubHeading className='mt-4 mb-1 font-serif'>
        5. Accuracy of materials
      </SubHeading>
      <p>
        The materials appearing on VideoNote's website could include technical,
        typographical, or photographic errors. VideoNote does not warrant that
        any of the materials on its website are accurate, complete or current.
        VideoNote may make changes to the materials contained on its website at
        any time without notice. However VideoNote does not make any commitment
        to update the font-serif.
      </p>
      <SubHeading className='mt-4 mb-1 italic'>6. Links</SubHeading>
      <p>
        VideoNote has not reviewed all of the sites linked to its website and is
        not responsible for the contents of any such linked site. The inclusion
        of any link does not imply endorsement by VideoNote of the site. Use of
        any such linked website is at the font-serif's own risk.
      </p>
      <SubHeading className='mt-4 mb-1 italic'>7. Modifications</SubHeading>
      <p>
        VideoNote may revise these terms of service for its website at any time
        without notice. By using this website you are agreeing to be bound by
        the then current version of these font-serifof service.
      </p>
      <SubHeading className='mt-4 mb-1 italic'>8. Governing Law</SubHeading>
      <p>
        These terms and conditions are governed by and construed in accordance
        with the laws of Australia and you irrevocably submit to the exclusive
        jurisdiction of the courts in that State or location.
      </p>
    </div>
  )
}
