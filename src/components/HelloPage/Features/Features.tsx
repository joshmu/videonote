import { AnimatePresence, Variants, motion } from 'framer-motion'

import { useReveal } from '@/root/src/hooks/useReveal'
import { Heading } from '@/shared/Text/Text'

const featuresData = [
  {
    title: 'Timestamped notes',
    content:
      'Every note entered will record your video play position, simply click the note to view that point in the video!',
  },
  {
    title: 'Share it',
    content:
      'Share your notes and video with your friends and colleagues via a custom url!  No sign in is required!',
  },
  {
    title: 'Made for speed',
    content:
      'Built with an array of smart keyboard shortcuts so you stay focused on what matters most.',
  },
  {
    title: 'A multitude of Video sources',
    content:
      'Vimeo, Youtube, Facebook, and many more!  VideoNote can even use your Dropbox videos!',
  },
  {
    title: 'Unlimited Projects, Unlimited Notes',
    content: 'Create as many projects as you need! As many notes as you need!',
  },
  {
    title: 'Export a transcript',
    content: 'Download a document of your notes to use elsewhere!',
  },
]

const featureVariants: Variants = {
  initial: { opacity: 0 },
  animate: custom => ({ opacity: 1, transition: { delay: 0.1 * custom } }),
  exit: { opacity: 0 },
}

export const Features = () => {
  const [ref, controls] = useReveal()

  return (
    <div id='features' className='container px-4 mx-auto my-24'>
      {/* header */}
      <div className='flex items-center mb-2'>
        <Heading>Features</Heading>
        <h2 className='ml-3 text-xl italic opacity-50 text-themeText'>
          ...more to come!
        </h2>
      </div>

      {/* features */}
      <div ref={ref} className='grid grid-cols-2 gap-10 md:grid-cols-3'>
        <AnimatePresence>
          {featuresData.map((data, idx) => (
            <motion.div
              custom={idx}
              key={data.title}
              initial='initial'
              animate={controls}
              exit='exit'
              variants={featureVariants}
            >
              <FeatureItem idx={idx} data={data} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

const FeatureItem = ({ data: { title, content }, idx }) => {
  return (
    <div className='relative mt-2'>
      <FeatureTitle idx={idx}>{title}</FeatureTitle>
      <FeatureContent>{content}</FeatureContent>
    </div>
  )
}

const FeatureTitle = ({ children, idx }) => {
  return (
    <div className='relative mb-2'>
      <Shape idx={idx} />
      <h2 className='relative z-10 font-serif text-2xl font-bold capitalize text-themeAccent'>
        {children}
      </h2>
    </div>
  )
}

const FeatureContent = ({ children }) => {
  return <p className='tracking-wide text-themetext2'>{children}</p>
}

const Shape = ({ idx }) => {
  // style variants based on idx
  const styles = [
    {
      backgroundColor: 'red',
      width: '1rem',
    },
    {
      backgroundColor: 'green',
      borderRadius: '100%',
    },
    {
      backgroundColor: 'darkgray',
      transform: 'rotate(45deg)',
      width: '0.75rem',
    },
    {
      backgroundColor: 'blue',
    },
  ]

  const choice = idx % 4

  return (
    <div
      className='absolute top-0 left-0 z-0 w-8 h-8 transform opacity-50 -translate-x-1/4 -translate-y-1/4'
      style={styles[choice]}
    ></div>
  )
}
