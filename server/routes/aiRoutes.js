const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { chatWithAI } = require('../controllers/aiController');

// All AI routes should be protected
router.use(protect);

// Route for chat
router.post('/chat', chatWithAI);

module.exports = router;
