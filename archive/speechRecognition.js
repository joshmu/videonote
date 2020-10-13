export const initSpeechRecognition = () => {
  console.log('init speech recognition')
  const SpeechRecognition =
    globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition
  const recognition = new SpeechRecognition()

  recognition.continuous = true
  recognition.lang = 'en-US'
  recognition.interimResults = true
  recognition.maxAlternatives = 1

  document.addEventListener(
    'keydown',
    e => {
      if (e.key !== ' ') return
      recognition.start()
      console.log('Ready to receive speech.')
    },
    { once: true }
  )

  recognition.onresult = function (event) {
    console.log('onresult', event)
    const transcript = event.results[0][0].transcript
    const confidence = event.results[0][0].confidence
    console.log({ transcript, confidence })
  }

  recognition.onspeechend = function () {
    console.log('onspeechend')
    recognition.stop()
  }

  recognition.onnomatch = function (event) {
    console.log('onnomatch', event)
  }

  recognition.onerror = function (event) {
    console.log('onerror', event)
  }

  return recognition
}
