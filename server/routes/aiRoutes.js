const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { chatWithAI, getChatHistory } = require('../controllers/aiController');

// All AI routes should be protected
router.use(protect);

// Route for chat
router.post('/chat', chatWithAI);
router.get('/history', getChatHistory);

module.exports = router;
