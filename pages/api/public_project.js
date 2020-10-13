import { extractPublicProject } from '@/utils/apiHelpers'
import { Project } from '@/utils/mongoose'

// GET 1 PROJECT
export default async (req, res) => {
  // project share id
  const { id } = req.body

  // get project
  let project
  try {
    project = await Project.findById(id).lean()
  } catch (error) {
    // no project found
    return res.status(400).json({ msg: 'Project does not exist.' })
  }

  // project is public
  if (project.isPrivate)
    return res.status(401).json({ msg: 'Project is private.' })

  // pass back as a an array to avoid conflicts since vn typically handles 'projects' on server response
  const projects = [project]

  // send data
  res.status(200).json({
    projects: projects.map(p => extractPublicProject(p)),
  })
}
