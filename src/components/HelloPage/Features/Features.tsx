import { Heading, Heading2 } from '@/shared/Text/Text'

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

export const Features = () => {
  return (
    <div className='container px-4 mx-auto my-32'>
      {/* header */}
      <div className='flex items-center mb-2'>
        <Heading>Features</Heading>
        <h2 className='ml-3 text-xl italic opacity-50 text-themeText'>
          ...more to come!
        </h2>
      </div>

      {/* features */}
      <div className='grid grid-cols-2 gap-10 md:grid-cols-3'>
        {featuresData.map((data, idx) => (
          <FeatureItem key={idx} idx={idx} data={data} />
        ))}
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
