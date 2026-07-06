// routes/api.js
const express = require('express');
const router = express.Router();
const answersController = require('../controllers/answersController');

router.post('/answers/about-her', answersController.saveAboutHer);
router.post('/answers/about-me', answersController.saveAboutMe);
router.post('/answers/decision', answersController.saveDecision);
router.get('/answers/me', answersController.getMine);

module.exports = router;
