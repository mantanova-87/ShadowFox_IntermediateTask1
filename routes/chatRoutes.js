const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { auth } = require('../middleware/auth');

router.use(auth); // all chat routes require login

router.get('/sessions/:sessionId', chatController.getHistory);
router.post('/message', chatController.sendMessage);
router.delete('/sessions/:sessionId', chatController.deleteSession);

module.exports = router;
