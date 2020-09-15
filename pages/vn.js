import Layout from '../src/components/Layout'
import List from '../src/components/List/List'
import ProgressBar from '../src/components/shared/ProgressBar'
import NavBtn from '../src/components/shared/NavBtn'

export default function Main() {
  return (
    <Layout>
      <NavBtn>Back Home</NavBtn>
      <ProgressBar />
      <List />
    </Layout>
  )
}
