import { useState, useEffect, useRef } from 'react';
import { Button, Input, Badge, Spin, Card } from 'antd';
import { MessageOutlined, SendOutlined, CloseOutlined, UserOutlined } from '@ant-design/icons';
import { chatService, type ChatMessage } from '../services/chatService';
import { getImageUrl } from '../utils/imageHelper';
import { useAuth } from '../contexts/AuthContext';

const ChatWidget = () => {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setMessages([]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isOpen) {
      loadChatHistory();
      setUnreadCount(0);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const response = await chatService.getChatHistory(50);
      console.log("aaaa: ", response);
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Failed to load chat history:', error);
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      sender: 'user',
      message: inputMessage,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await chatService.sendMessage(inputMessage);

      const botMessages: ChatMessage[] = response.responses.map(r => ({
        sender: 'bot',
        message: r.text,
        intent: r.intent,
        confidence: r.confidence,
        image_url: r.image,
        product_id: r.product_id,
        created_at: new Date().toISOString()
      }));

      setMessages(prev => [...prev, ...botMessages]);

      if (!isOpen) {
        setUnreadCount(prev => prev + botMessages.length);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        sender: 'bot',
        message: 'Sorry, I cannot connect right now. Please try again later.',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[1000]">
        <Badge count={unreadCount} offset={[-5, 5]}>
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={isOpen ? <CloseOutlined /> : <MessageOutlined />}
            onClick={() => setIsOpen(!isOpen)}
            className="w-[56px] h-[56px] text-xl shadow-lg"
            style={{
              background: '#1f2937',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}
          />
        </Badge>
      </div>

      {isOpen && (
        <div className="fixed bottom-[90px] right-6 w-[360px] h-[550px] z-[999] md:w-[360px] md:h-[550px] max-md:w-[calc(100vw-32px)] max-md:h-[calc(100vh-120px)] max-md:right-4 max-md:bottom-[90px]">
          <Card
            className="w-full h-full shadow-2xl rounded-2xl overflow-hidden flex flex-col"
            bodyStyle={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <div
              className="px-4 py-3 flex items-center justify-between border-b border-gray-200"
              style={{ background: '#1f2937' }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                  <MessageOutlined className="text-white text-sm" />
                </div>
                <div>
                  <div className="font-medium text-white text-sm">Customer Support</div>
                  <div className="text-xs text-gray-400">Online</div>
                </div>
              </div>
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white hover:bg-gray-700"
                size="small"
              />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
              {messages.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                    <MessageOutlined className="text-blue-600 text-2xl" />
                  </div>
                  <div className="text-sm">Hello! How can I help you?</div>
                </div>
              )}

              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-2 mb-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''
                    }`}
                >
                  <div className="flex-shrink-0">
                    {msg.sender === 'user' ? (
                      <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                        <UserOutlined className="text-gray-700 text-xs" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <MessageOutlined className="text-blue-600 text-xs" />
                      </div>
                    )}
                  </div>
                  <div className={msg.image_url ? "max-w-[85%]" : "max-w-[70%]"}>
                    <div
                      className={`px-3 py-2 rounded-lg break-words ${msg.sender === 'user'
                          ? 'bg-gray-800 text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-800 border border-gray-200 rounded-bl-sm'
                        }`}
                    >
                      {msg.image_url ? (
                        <div className="flex gap-2.5 items-start">
                          <img
                            src={getImageUrl(msg.image_url)}
                            alt="Product"
                            className={`rounded-md shadow-sm flex-shrink-0 ${msg.product_id ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
                              }`}
                            style={{ width: '85px', height: '85px', objectFit: 'cover' }}
                            onClick={() => {
                              if (msg.product_id) {
                                window.open(`/products/${msg.product_id}`, '_blank');
                              }
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                            {msg.product_id && (
                              <button
                                onClick={() => window.open(`/products/${msg.product_id}`, '_blank')}
                                className="text-blue-600 hover:text-blue-700 text-xs mt-1.5 font-medium inline-flex items-center gap-1"
                              >
                                View details →
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                          {msg.product_id && (
                            <button
                              onClick={() => window.open(`/products/${msg.product_id}`, '_blank')}
                              className="text-blue-600 hover:text-blue-700 text-xs mt-1.5 font-medium inline-flex items-center gap-1"
                            >
                              Xem chi tiết →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {msg.created_at && (
                      <div
                        className={`text-[11px] text-gray-400 mt-1 ${msg.sender === 'user' ? 'text-left' : 'text-right'
                          }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2 mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                      <MessageOutlined className="text-blue-600 text-xs" />
                    </div>
                  </div>
                  <div className="max-w-[70%]">
                    <div className="px-3 py-2 rounded-lg bg-gray-100 border border-gray-200 rounded-bl-sm">
                      <Spin size="small" /> <span className="ml-2 text-xs">Replying...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-200 flex gap-2 items-end">
              <Input.TextArea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                autoSize={{ minRows: 1, maxRows: 3 }}
                disabled={loading}
                className="flex-1"
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                loading={loading}
                disabled={!inputMessage.trim()}
                className="bg-gray-800 hover:bg-gray-900 border-none"
              />
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default ChatWidget;