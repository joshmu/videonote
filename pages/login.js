import Layout from '../src/components/Layout'
import StyledLink from '../src/components/shared/StyledLink'

export default function Login() {
  return (
    <Layout>
      <p>Login</p>
      <StyledLink>Back Home</StyledLink>
      <StyledLink href='/vn'>Go to App</StyledLink>
    </Layout>
  )
}
