/**
 * API Routes for Task Breakdown & AI Services
 */

const express = require('express');
const router = express.Router();
const { validateBreakdownRequest } = require('../utils/validation');
const { generateAiTaskBreakdown, generateFallbackBreakdown } = require('../services/gemini');

// Simple in-memory rate limiter per IP: max 20 requests per minute
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.startTime > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, startTime: now });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  entry.count += 1;
  return true;
}

// Clean up old rate limit records periodically
const rateLimitInterval = setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now - entry.startTime > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW_MS);
rateLimitInterval.unref();

/**
 * POST /api/breakdown
 * Generates an AI-assisted or template-assisted breakdown for a task
 */
router.post('/breakdown', async (req, res) => {
  try {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({
        success: false,
        error: 'Too many breakdown requests. Please wait a minute before generating another plan.'
      });
    }

    // Input validation
    const validation = validateBreakdownRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    const taskData = validation.data;
    const forceFallback = req.query.fallback === 'true' || req.body.forceFallback === true;

    let result;
    if (forceFallback) {
      result = generateFallbackBreakdown(taskData, 'Manual breakdown requested by user.');
    } else {
      result = await generateAiTaskBreakdown(taskData);
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('[Breakdown Route Error]', err);
    return res.status(500).json({
      success: false,
      error: 'An internal server error occurred while generating the task breakdown.'
    });
  }
});

/**
 * GET /api/health
 * Service status and AI engine status check
 */
router.get('/health', (req, res) => {
  const hasApiKey = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here' &&
    process.env.GEMINI_API_KEY.trim().length > 0
  );

  res.json({
    status: 'online',
    appName: 'DeadlineShield',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    aiConfigured: hasApiKey,
    aiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    mode: hasApiKey ? 'Gemini AI Live Mode' : 'Academic Fallback Mode (Add GEMINI_API_KEY for live AI)'
  });
});

module.exports = router;
