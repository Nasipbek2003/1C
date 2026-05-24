'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import LoadingSpinner from '../../components/LoadingSpinner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Message {
  id: string;
  chatSessionId: string;
  senderId: string;
  senderType: 'CUSTOMER' | 'OPERATOR' | 'BOT';
  content: string;
  createdAt: string;
}

interface ChatSession {
  id: string;
  customerId: string;
  isActive: boolean;
  lastActivityAt: string;
  customer: {
    id: string;
    firstName?: string;
    username?: string;
    phone?: string;
  };
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadChatData();
    const interval = setInterval(loadMessages, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Load session info
      const sessionResponse = await axios.get(`${API_URL}/api/chat-sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSession(sessionResponse.data.session);

      // Load messages
      await loadMessages();
      setLoading(false);
    } catch (error) {
      console.error('Error loading chat:', error);
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/chat-sessions/${sessionId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const operatorData = JSON.parse(localStorage.getItem('operator') || '{}');
      
      await axios.post(
        `${API_URL}/api/messages`,
        {
          chatSessionId: sessionId,
          senderId: operatorData.id,
          senderType: 'OPERATOR',
          content: newMessage
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setNewMessage('');
      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const closeChat = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/chat-sessions/${sessionId}`,
        { isActive: false },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      router.push('/dashboard');
    } catch (error) {
      console.error('Error closing chat:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Назад
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {session?.customer.firstName || session?.customer.username || 'Клиент'}
              </h1>
              <p className="text-sm text-gray-500">
                ID: {session?.customer.id.substring(0, 8)}...
                {session?.customer.phone && ` • ${session.customer.phone}`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm ${
              session?.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {session?.isActive ? 'Активен' : 'Закрыт'}
            </span>
            {session?.isActive && (
              <button
                onClick={closeChat}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Закрыть чат
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-250px)]">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderType === 'OPERATOR' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    message.senderType === 'OPERATOR'
                      ? 'bg-blue-600 text-white'
                      : message.senderType === 'BOT'
                      ? 'bg-gray-200 text-gray-800'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="text-sm mb-1">
                    {message.senderType === 'OPERATOR' && '👤 Оператор'}
                    {message.senderType === 'BOT' && '🤖 Бот'}
                    {message.senderType === 'CUSTOMER' && '👨‍💼 Клиент'}
                  </div>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <div className={`text-xs mt-1 ${
                    message.senderType === 'OPERATOR' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {new Date(message.createdAt).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          {session?.isActive && (
            <form onSubmit={sendMessage} className="border-t border-gray-200 p-4">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Введите сообщение..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Отправить
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
