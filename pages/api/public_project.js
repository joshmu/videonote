import { connectToDatabase } from '../../utils/mongodb'
import { extractPublicProject } from '../../utils/apiHelpers'

export default async (req, res) => {
  // project id
  const { id } = req.body

  // connect db
  const { db } = await connectToDatabase()

  // get project
  const project = await db.collection('projects').findOne({ _id: id })

  // project exists
  if (!project) return res.status(400).json({ msg: 'Project does not exist.' })

  // project is public
  if (project.private)
    return res.status(401).json({ msg: 'Project is private.' })

  // pass back as a an array to avoid conflicts since vn typically handles 'projects' on server response
  const projects = [project]

  // send data
  res.status(200).json({
    projects: projects.map(p => extractPublicProject(p)),
  })
}
