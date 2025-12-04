const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const router = express.Router();

// store uploaded audio in backend/uploads
const upload = multer({ dest: path.join(__dirname, '..', 'uploads') });

// POST /api/voice/transcribe
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No audio file uploaded' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY is missing in environment variables');
    return res
      .status(500)
      .json({ message: 'Server is not configured with OPENAI_API_KEY' });
  }

  const openai = new OpenAI({ apiKey });

  const filePath = req.file.path;

  try {
    const fileStream = fs.createReadStream(filePath);

    const transcription = await openai.audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-1', // OpenAI Whisper model
      language: 'en',
    });

    const transcriptText = transcription.text || '';

    return res.json({ transcript: transcriptText });
  } catch (err) {
    console.error(
      'Whisper transcription error:',
      err?.response?.data || err.message
    );
    return res.status(500).json({ message: 'Transcription failed' });
  } finally {
    // delete temp file
    fs.unlink(filePath, () => {});
  }
});

module.exports = router;
