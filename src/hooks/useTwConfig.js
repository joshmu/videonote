import resolveConfig from 'tailwindcss/resolveConfig'

import twConfigFile from '@/root/tailwind.config'

const twConfig = resolveConfig(twConfigFile)

const useTwConfig = () => twConfig

export default useTwConfig
