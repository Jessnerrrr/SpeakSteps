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