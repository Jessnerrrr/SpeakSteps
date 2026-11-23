const express = require('express');
const cors = require('cors');
const fs = require('node:fs');
const path = require('node:path');
const { connectDB, getDatabaseTree, redactUri } = require('./config/db');
const { getJwtSecret } = require('./users/session');

const app = express();
const PORT = process.env.PORT || 5000;
const { users: userRoutes, admins: adminRoutes, therapists: therapistRoutes, teachers: teacherRoutes } = require('./users/routes');
const { patients: patientRoutes } = require('./patients/routes');
const { learning: learningRoutes } = require('./learning/routes');
const { audio: audioRoutes } = require('./audio/routes');
const Patient = require('./patients/Patient');

fs.mkdirSync(path.join(__dirname, 'uploads', 'audio'), { recursive: true });

app.use(cors());
app.use(express.json({ limit: '3mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/audio', audioRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/therapists', therapistRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api', learningRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'SpeakSteps Backend API is running',
    endpoints: {
      health: '/health',
      databases: '/api/databases',
    },
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Endpoint to render all databases & collections
app.get('/api/databases', async (req, res) => {
  try {
    const tree = await getDatabaseTree();
    res.json({
      success: true,
      cluster: 'speaksteps.xh7eu5s.mongodb.net',
      databases: tree,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: redactUri(error.message),
    });
  }
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ success: false, error: 'Request is too large.' });
  }
  if (error instanceof SyntaxError && Object.prototype.hasOwnProperty.call(error, 'body')) {
    return res.status(400).json({ success: false, error: 'Request body must be valid JSON.' });
  }
  console.error(`[Server] Request failed: ${redactUri(error.message)}`);
  return res.status(500).json({ success: false, error: 'An unexpected server error occurred.' });
});

// Start server after connecting to database
const startServer = async () => {
  getJwtSecret();
  const connection = await connectDB();
  await connection.connection.db.collection('audit_logs').createIndex(
    { createdAt: -1 },
    { name: 'createdAt_-1' },
  );
  await Patient.createIndexes();
  app.listen(PORT, () => {
    console.log(`[Server] SpeakSteps backend running on http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error(`[Server] Startup failed: ${redactUri(error.message)}`);
  process.exitCode = 1;
});
