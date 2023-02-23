/* eslint-disable linebreak-style */
/*This is just a test file for setting up Mongo DB connection*/

/* eslint-disable linebreak-style */
const mongoose = require('mongoose')

if (process.argv.length < 3) {
  console.log('give password as argument')
  process.exit(1)
}


const password = process.argv[2]

const url = `mongodb+srv://saquibmehmood:${password}@cluster0.30blbfb.mongodb.net/testNoteApp?retryWrites=true&w=majority
`

mongoose.set('strictQuery', false)
mongoose.connect(url)

const noteSchema = new mongoose.Schema ({
  content: String,
  important: Boolean,
  date: { type: Date, default: Date.now },
})

const Note = mongoose.model('Note', noteSchema)

// Change content below to add more notes
const note = new Note({
  content: 'CSS is hard',
  important: true,
})

note.save().then(result => {
  console.log('note saved!')
  mongoose.connection.close()
})

// Note.find({}).then(result => {
//   result.forEach(note => {
//     console.log(note)
//   })
//   mongoose.connection.close()
// })