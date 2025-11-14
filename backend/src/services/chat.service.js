const knex = require('../database/knex');
const crypto = require('crypto');
const axios = require('axios');

const RASA_URL = process.env.RASA_URL || 'http://localhost:5005';

function generateSessionId() {
  return crypto.randomBytes(16).toString('hex');
}

function generateGuestToken() {
  return crypto.randomBytes(20).toString('hex');
}

async function getOrCreateSession(userId, guestToken) {
  if (!userId && !guestToken) {
    return null;
  }

  let session = await knex('chat_sessions')
    .where(function() {
      if (userId) {
        this.where('user_id', userId);
      } else if (guestToken) {
        this.where('guest_token', guestToken);
      }
    })
    .whereNull('ended_at')
    .orderBy('started_at', 'desc')
    .first();

  if (session && (new Date() - new Date(session.started_at)) <= 24 * 60 * 60 * 1000) {
    return session;
  }

  const sessionId = generateSessionId();
  await knex('chat_sessions').insert({
    session_id: sessionId,
    user_id: userId || null,
    guest_token: guestToken || null,
    started_at: knex.fn.now()
  });
  
  return await knex('chat_sessions')
    .where('session_id', sessionId)
    .first();
}

async function sendMessageToRasa(message, senderId, userId = null) {
  try {
    const payload = {
      sender: senderId,
      message: message
    };
    

    if (userId) {
      payload.metadata = { user_id: userId };
    } else {
      console.log(`No user_id to send to Rasa`);
    }
    
    const response = await axios.post(`${RASA_URL}/webhooks/rest/webhook`, payload, {
      timeout: 25000  
    });
    
    return response.data; 
  } catch (error) {
    console.error('Rasa API error:', error.message);
    throw new Error('Không thể kết nối với chatbot');
  }
}

async function saveMessage(sessionId, userId, guestToken, sender, message, intent = null, confidence = null, metadata = null, imageUrl = null) {
  const [messageId] = await knex('chat_messages').insert({
    session_id: sessionId,
    user_id: userId || null,
    guest_token: guestToken || null,
    sender,
    message,
    intent,
    confidence,
    metadata: metadata ? JSON.stringify(metadata) : null,
    image_url: imageUrl
  });

  await knex('chat_sessions')
    .where('session_id', sessionId)
    .increment('message_count', 1);

  return messageId;
}

async function sendMessage(userId, guestToken, message) {
  const session = await getOrCreateSession(userId, guestToken);
  
  await saveMessage(
    session.session_id,
    userId,
    guestToken,
    'user',
    message
  );


  const senderId = session.session_id;
  const botResponses = await sendMessageToRasa(message, senderId, userId);


  const responses = [];
  for (let i = 0; i < botResponses.length; i++) {
    const botMsg = botResponses[i];

    const customData = botMsg.custom || {};
    const text = customData.text || botMsg.text || '';
    const imageUrl = customData.image || botMsg.image || null;
    const productId = customData.product_id || null;
    
    if (productId) {
      console.log(`✅ Product ${productId}: ${text.substring(0, 50)}... | Image: ${imageUrl ? 'YES' : 'NO'}`);
    }
    
    const metadata = productId ? { product_id: productId } : (botMsg.metadata || null);
    
    await saveMessage(
      session.session_id,
      userId,
      guestToken,
      'bot',
      text,
      botMsg.intent || null,
      botMsg.confidence || null,
      metadata,
      imageUrl
    );
    
    responses.push({
      text: text,
      intent: botMsg.intent,
      confidence: botMsg.confidence,
      image: imageUrl,
      product_id: productId
    });
  }

  return {
    session_id: session.session_id,
    responses
  };
}

async function migrateGuestToUser(userId, guestToken) {
  await knex('chat_sessions')
    .where('guest_token', guestToken)
    .whereNull('user_id')
    .whereNull('ended_at')
    .update({
      user_id: userId,
      guest_token: null
    });
  
  await knex('chat_messages')
    .where('guest_token', guestToken)
    .update({
      user_id: userId,
      guest_token: null
    });
  
}

async function getChatHistory(userId, guestToken, limit = 50) {
  const session = await getOrCreateSession(userId, guestToken);
  
  if (!session) {
    return [];
  }


  const messages = await knex('chat_messages')
    .where('session_id', session.session_id)
    .orderBy('created_at', 'desc')
    .orderBy('message_id','desc')
    .limit(limit);
  
  return messages.reverse().map(msg => ({
    ...msg,
    product_id: msg.metadata ? JSON.parse(msg.metadata).product_id : null
  }));
}

async function endSession(sessionId) {
  await knex('chat_sessions')
    .where('session_id', sessionId)
    .update({ ended_at: knex.fn.now() });
}

async function getSessionStats(userId) {
  const stats = await knex('chat_sessions')
    .where('user_id', userId)
    .select(
      knex.raw('COUNT(*) as total_sessions'),
      knex.raw('SUM(message_count) as total_messages'),
      knex.raw('AVG(message_count) as avg_messages_per_session')
    )
    .first();

  return stats;
}

module.exports = {
  generateGuestToken,
  getOrCreateSession,
  sendMessage,
  getChatHistory,
  endSession,
  getSessionStats,
  migrateGuestToUser
};