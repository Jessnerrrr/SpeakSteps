const crypto = require('node:crypto');
const fs = require('node:fs');
const mongoose = require('mongoose');
const path = require('node:path');
const express = require('express');
const multer = require('multer');
const User = require('../users/User');
const { requireSession } = require('../users/session');
const { logAuditEvent } = require('../utils/auditLogger');

const router = express.Router();
const audioDirectory = process.env.VERCEL
  ? path.join('/tmp', 'uploads', 'audio')
  : path.join(__dirname, '..', 'uploads', 'audio');

fs.mkdirSync(audioDirectory, { recursive: true });

const audioTypesByExtension = {
  '.m4a': ['audio/mp4', 'audio/x-m4a', 'audio/m4a'],
  '.mp3': ['audio/mpeg', 'audio/mp3', 'audio/x-mp3'],
  '.wav': ['audio/wav', 'audio/x-wav', 'audio/wave', 'audio/vnd.wave'],
  '.webm': ['audio/webm', 'video/webm'],
  '.aac': ['audio/aac', 'audio/aacp', 'audio/x-aac'],
  '.ogg': ['audio/ogg', 'audio/vorbis', 'audio/opus'],
};

class UploadValidationError extends Error {}

const upload = multer({
  storage: multer.diskStorage({
    destination: audioDirectory,
    filename: (req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`);
    },
  }),
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const allowedMimeTypes = audioTypesByExtension[extension];
    if (!allowedMimeTypes || !allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
      return callback(new UploadValidationError('Upload an m4a, mp3, wav, webm, aac, or ogg audio file.'));
    }
    return callback(null, true);
  },
});

async function requireActiveUser(req, res, next) {
  try {
    const user = await User.findById(req.session.sub).select('role status full_name');
    if (!user || user.status !== 'verified' || user.role !== req.session.role) {
      return res.status(401).json({ success: false, error: 'Your account is no longer available. Please sign in again.' });
    }
    req.auditActor = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

function receiveAudio(req, res, next) {
  upload.single('audio')(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, error: 'Audio files must be 15 MB or smaller.' });
    }
    if (error instanceof multer.MulterError || error instanceof UploadValidationError) {
      return res.status(400).json({ success: false, error: error.message });
    }
    return next(error);
  });
}

router.post('/upload', requireSession, requireActiveUser, receiveAudio, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'An audio file is required in the audio field.' });
  }
  void logAuditEvent(mongoose.connection.db, {
    actorId: req.auditActor._id,
    actorRole: req.auditActor.role,
    actorName: req.auditActor.full_name,
    action: 'Audio uploaded',
    category: 'Media',
    targetType: 'audio_file',
    targetId: req.file.filename,
    details: 'An audio file was uploaded.',
  });
  return res.status(201).json({
    audioUrl: `/uploads/audio/${req.file.filename}`,
    filename: req.file.filename,
  });
});

module.exports = { audio: router };