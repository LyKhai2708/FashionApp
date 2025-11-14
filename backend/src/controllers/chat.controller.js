const chatService = require('../services/chat.service');

async function sendMessage(req, res, next) {
  try {
    const { message } = req.body;
    const userId = req.user?.id || null;
    let guestToken = req.cookies.guest_token || req.body.guest_token;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!userId && !guestToken) {
      guestToken = chatService.generateGuestToken();
      res.cookie('guest_token', guestToken, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, 
        sameSite: 'lax'
      });
    }

    const result = await chatService.sendMessage(userId, guestToken, message);

    res.json({
      success: true,
      session_id: result.session_id,
      responses: result.responses,
      guest_token: !userId ? guestToken : undefined
    });
  } catch (error) {
    next(error);
  }
}

async function getChatHistory(req, res, next) {
  try {
    const userId = req.user?.id || null;
    const guestToken = req.cookies.guest_token || req.query.guest_token;
    const limit = parseInt(req.query.limit) || 50;

    const messages = await chatService.getChatHistory(userId, guestToken, limit);

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    next(error);
  }
}

async function endSession(req, res, next) {
  try {
    const { session_id } = req.params;

    await chatService.endSession(session_id);

    res.json({
      success: true,
      message: 'Session ended'
    });
  } catch (error) {
    next(error);
  }
}

async function getStats(req, res, next) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const stats = await chatService.getSessionStats(userId);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  sendMessage,
  getChatHistory,
  endSession,
  getStats
};