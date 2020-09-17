import Layout from '../src/components/Layout'
import List from '../src/components/List/List'
import ProgressBar from '../src/components/shared/ProgressBar'
import NavBtn from '../src/components/shared/NavBtn'
import ThemeToggle from '../src/components/ThemeToggle'

export default function Main() {
  return (
    <Layout>
      <ThemeToggle />
      <NavBtn>Back Home</NavBtn>
      <ProgressBar />
      <List />
    </Layout>
  )
}
