const nodemailer = require('nodemailer')

module.exports = async (req, res) => {
  const {
    email: from, // sender address
    name: subject, // Subject line
    message: text, // plain text body
  } = req.body

  try {
    console.log({ from, subject, text })
    const info = await email({ from, subject, text })
    res.status(200).send({ msg: 'success', info })
  } catch (err) {
    console.error(err)
    res.status(400).json({ error: err.message })
  }
}

async function email({ from, subject, text }) {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: 'smtp.dreamhost.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  const mailItem = {
    from,
    to: 'mu@joshmu.com',
    subject: `✨VIDEONOTE: ${subject}`,
    text,
    // if we don't specify html then lets create it from the plain text
    // html: `<pre>${text}</pre>`,
  }

  // send mail with defined transport object
  let info = await transporter.sendMail(mailItem)

  return info
}
