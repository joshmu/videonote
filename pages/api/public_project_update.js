import { Project } from '@/utils/mongoose'

export default async (req, res) => {
  // project
  const { project } = req.body

  // get project
  let projectDoc
  try {
    projectDoc = await Project.findById(project._id)
  } catch (error) {
    // project exists
    return res.status(404).json({ msg: 'Project does not exist.' })
  }

  // project is public
  if (projectDoc.isPrivate)
    return res.status(401).json({ msg: 'Project is private.' })

  try {
    // update project
    //* only allow todos to be updated
    await projectDoc.updateOne({ $set: { todos: project.todos } })
    await projectDoc.save()
  } catch (error) {
    console.error(error)
    return res.status(400).json({ msg: error.message })
  }

  // send data
  res.status(200).json({
    msg: `Success, project updated. (${projectDoc._id})`,
  })
}
