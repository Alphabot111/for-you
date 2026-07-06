// controllers/answersController.js
const db = require('../data/db');
const { cleanAnswers, cleanText } = require('../middleware/validate');

// POST /api/answers/about-her
async function saveAboutHer(req, res) {
  try {
    const sessionId = req.session.id;
    const answers = cleanAnswers(req.body.answers);
    const saved = await db.saveSubmission(sessionId, { aboutHer: answers });
    res.json({ ok: true, data: saved.aboutHer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Could not save answers.' });
  }
}

// POST /api/answers/about-me
async function saveAboutMe(req, res) {
  try {
    const sessionId = req.session.id;
    const answers = cleanAnswers(req.body.answers);
    const saved = await db.saveSubmission(sessionId, { aboutMe: answers });
    res.json({ ok: true, data: saved.aboutMe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Could not save answers.' });
  }
}

// POST /api/answers/decision
async function saveDecision(req, res) {
  try {
    const sessionId = req.session.id;
    const decision = cleanText(req.body.decision, 50);
    const allowed = ['yes', 'lets-talk', 'need-time'];
    if (!allowed.includes(decision)) {
      return res.status(400).json({ ok: false, error: 'Invalid decision.' });
    }
    const saved = await db.saveSubmission(sessionId, { decision });
    res.json({ ok: true, data: saved.decision });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Could not save your answer.' });
  }
}

// GET /api/answers/me  (used by Page 5 to build the confession)
async function getMine(req, res) {
  try {
    const sessionId = req.session.id;
    const submission = db.getSubmission(sessionId) || {};
    res.json({ ok: true, data: submission });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Could not load your answers.' });
  }
}

module.exports = { saveAboutHer, saveAboutMe, saveDecision, getMine };
