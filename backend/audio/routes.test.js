const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { once } = require('node:events');
const express = require('express');
const { test } = require('node:test');
const User = require('../users/User');
const { signAccessToken } = require('../users/session');
const { audio: audioRoutes } = require('./routes');

process.env.JWT_SECRET = 'audio-upload-test-secret-at-least-32-characters';

test('audio upload accepts authenticated audio and serves it statically', async () => {
  const uploadsDirectory = path.join(__dirname, '..', 'uploads');
  const audioDirectory = path.join(uploadsDirectory, 'audio');
  fs.mkdirSync(audioDirectory, { recursive: true });

  const originalFindById = User.findById;
  User.findById = () => ({
    select: async () => ({ role: 'therapist', status: 'verified' }),
  });

  const app = express();
  app.use('/uploads', express.static(uploadsDirectory));
  app.use('/api/audio', audioRoutes);
  const server = app.listen(0);
  const uploadedFiles = [];

  try {
    await once(server, 'listening');
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const token = signAccessToken({ _id: '0123456789abcdef01234567', role: 'therapist' });

    const form = new FormData();
    form.append('audio', new Blob(['audio upload test'], { type: 'audio/mpeg' }), 'practice.mp3');
    const uploadResponse = await fetch(`${baseUrl}/api/audio/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const uploadResult = await uploadResponse.json();
    assert.equal(uploadResponse.status, 201);
    assert.match(uploadResult.filename, /^\d+-[a-f\d]{16}\.mp3$/);
    assert.equal(uploadResult.audioUrl, `/uploads/audio/${uploadResult.filename}`);
    uploadedFiles.push(path.join(audioDirectory, uploadResult.filename));

    const streamResponse = await fetch(`${baseUrl}${uploadResult.audioUrl}`);
    assert.equal(streamResponse.status, 200);
    assert.equal(await streamResponse.text(), 'audio upload test');

    const unauthorizedResponse = await fetch(`${baseUrl}/api/audio/upload`, { method: 'POST' });
    assert.equal(unauthorizedResponse.status, 401);

    const invalidForm = new FormData();
    invalidForm.append('audio', new Blob(['not audio'], { type: 'audio/mpeg' }), 'file.exe');
    const invalidResponse = await fetch(`${baseUrl}/api/audio/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: invalidForm,
    });
    assert.equal(invalidResponse.status, 400);

    const oversizedForm = new FormData();
    oversizedForm.append(
      'audio',
      new Blob([Buffer.alloc(15 * 1024 * 1024 + 1)], { type: 'audio/mpeg' }),
      'large.mp3',
    );
    const oversizedResponse = await fetch(`${baseUrl}/api/audio/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: oversizedForm,
    });
    assert.equal(oversizedResponse.status, 413);
  } finally {
    for (const file of uploadedFiles) {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
    User.findById = originalFindById;
    await new Promise((resolve) => server.close(resolve));
  }
});
