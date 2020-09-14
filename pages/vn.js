import Link from 'next/link'
import Layout from '../src/components/Layout'
import List from '../src/components/List/List'
import StyledLink from '../src/components/shared/StyledLink'

export default function Main() {
  return (
    <Layout>
      <StyledLink>Back Home</StyledLink>
      <List />
    </Layout>
  )
}
