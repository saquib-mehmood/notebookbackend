/* eslint-disable indent */
/* eslint-disable linebreak-style */
const notesRouter = require('express').Router()
const Note = require('../models/note')

// Fetching all notes
notesRouter.get('/', async (req, res) => {
  const notes = await Note.find({})
    res.json(notes)
})

// Fetching one note by id
notesRouter.get('/:id', async (req, res, next) => {
  const note = await Note.findByID(req.params.id)
      if(note) {
        res.json(note)
      } else {
        res.status(404).json({
      error: 'note note found'
    }).end()
      }
    })

// Creating a new note
notesRouter.post('/',  async(req, res, next) => {
  const body = req.body

  if (body.content === undefined) {
    return res.status(400).json({
      error: 'content missing'
    })
  }

  const note = new Note({
    content: body.content,
    important: body.important || false,
    date: new Date(),
  })

  const savedNote = await note.save()
      res.status(201).json(savedNote)

})

// Toggling Importance of a Note
notesRouter.put('/:id', async (req, res, next) => {
  const { content, important } = req.body

  const updatedNote = await Note.findByIdAndUpdate(req.params.id,
    { content, important },
    { new: true, runValidators: true }
  )
     res.json(updatedNote)
})

// Deleting a note
notesRouter.delete('/:id', async (req, res, next) => {
  await Note.findByIdAndRemove(req.params.id)
      res.status(204).end()
})

module.exports = notesRouter