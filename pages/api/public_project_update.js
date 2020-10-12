import { connectToDatabase } from '@/utils/mongodb'
import { extractPublicProject } from '@/utils/apiHelpers'

export default async (req, res) => {
  // project
  const { project } = req.body

  // connect db
  const { db } = await connectToDatabase()

  // get project
  const found = await db.collection('projects').findOne({ _id: project._id })

  // project exists
  if (!found) return res.status(404).json({ msg: 'Project does not exist.' })

  // project is public
  if (found.isPrivate)
    return res.status(401).json({ msg: 'Project is private.' })

  try {
    // update project
    //* only allow todos to be updated
    await db.collection('projects').updateOne(
      { _id: project._id },
      { $set: { todos: project.todos, updated: new Date() } }
      // { upsert: true }
    )
  } catch (error) {
    console.error(error)
    return res.status(400).json({ msg: error.message })
  }

  // send data
  res.status(200).json({
    msg: `Success, project updated. (${project._id})`,
  })
}
