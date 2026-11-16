/**
 * DeadlineShield Main Express Server
 * Hackathon 2026 - Education & Productivity Track
 * Developer: Devanshi Goyal
 */

const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const breakdownRoutes = require('./routes/breakdown');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Parsing Middleware
app.use(cors());
app.use(express.json({ limit: '500kb' }));
app.use(express.urlencoded({ extended: true }));

// Serve Static Frontend Assets
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// API Routes
app.use('/api', breakdownRoutes);

// Single Page Fallback (serves index.html for unknown web paths)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('[DeadlineShield Server Error]', err.stack || err);
  res.status(500).json({
    success: false,
    error: 'A server error occurred. Please try again.'
  });
});

// Start Server if run directly
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🛡️  DeadlineShield Server running at: http://localhost:${PORT}`);
    console.log(`📚  Student Productivity & AI Task Breakdown Engine`);
    console.log(`🤖  Gemini AI Status: ${process.env.GEMINI_API_KEY ? 'API Key Detected' : 'No API key set (Fallback mode active)'}`);
    console.log(`====================================================`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('Server terminated.');
    });
  });
}

module.exports = app;
