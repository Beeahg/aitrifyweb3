'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface ChatboxProps {
  agent: string;
}

const API_URL = 'https://ai.aitrify.com/ask';
const USER_LOGIN = 'mock_user';

const AGENT_CONFIGS: Record<string, { name: string; greeting: string; color: string }> = {
  anna: {
    name: 'ANNA',
    greeting:
      'ANNA ở đây để giúp bạn tìm được tiện nghi như điều hòa và thiết bị gia dụng chính hãng kèm dịch vụ chuẩn hãng nhưng giá trong Top rẻ nhất!',
    color: 'bg-green-50 border-green-300',
  },
  lisa: {
    name: 'LISA',
    greeting:
      'Chào Ông/Bà, LISA rất hân hạnh được trợ giúp về Golf, môn thể thao sang trọng và phóng khoáng đi kèm với dịch vụ khách hàng xuất sắc dành cho người có điều kiện',
    color: 'bg-blue-50 border-blue-300',
  },
};

export default function Chatbox({ agent }: ChatboxProps) {
  const config = AGENT_CONFIGS[agent] || AGENT_CONFIGS['anna'];
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [chatHistories, setChatHistories] = useState<Record<string, { sender: string; text: string }[]>>({
    anna: [{ sender: 'ai', text: AGENT_CONFIGS.anna.greeting }],
    lisa: [{ sender: 'ai', text: AGENT_CONFIGS.lisa.greeting }],
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const messages = chatHistories[agent] || [];

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading, agent]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };

    // Cập nhật lịch sử chat cho agent hiện tại
    setChatHistories((prev) => ({
      ...prev,
      [agent]: [...(prev[agent] || []), userMessage],
    }));
    setInput('');
    setLoading(true);

    const aiResponse = await mockChatAPI(input);
    setLoading(false);

    const aiMessage = { sender: 'ai', text: aiResponse };

    setChatHistories((prev) => ({
      ...prev,
      [agent]: [...(prev[agent] || []), userMessage, aiMessage],
    }));
  };

  const mockChatAPI = async (userInput: string) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userInput,
          user_login: USER_LOGIN,
          agent_id: agent,
        }),
      });
      if (!response.ok) throw new Error('Lỗi server');
      const data = await response.json();
      return data.answer || 'Trả lời từ AI: ' + JSON.stringify(data);
    } catch (error) {
      return 'Lỗi kết nối server: ' + (error as Error).message;
    }
  };

  return (
    <div
      className={`w-full max-w-3xl mx-auto rounded-xl border ${config.color} backdrop-blur shadow-lg p-4 flex flex-col gap-4`}
    >
      <div ref={chatContainerRef} className="max-h-72 overflow-y-auto space-y-2 mb-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`rounded-lg px-3 py-2 max-w-[80%] text-sm sm:text-base ${
              msg.sender === 'user'
                ? 'bg-indigo-100 self-end ml-auto text-right'
                : 'self-start flex items-center gap-2 ' +
                  (agent === 'lisa' ? 'bg-blue-50' : 'bg-green-50')
            }`}
          >
            {msg.sender === 'ai' ? (
              <div className="relative w-full pr-24"> {/* pr-24 để chừa không gian cho ảnh bên phải */}
                <div className="flex items-center gap-2">
                  <Image
                    src="/images/ai-logo-icon.png"
                    alt="AItrify Logo"
                    width={40}
                    height={40}
                    className="mr-2 rounded-full"
                  />
                  <span className="text-gray-900">{msg.text}</span>
                </div>

                {/* Ảnh sản phẩm ở góc trên bên phải */}
                {idx === 0 && (
                  <Image
                    src={agent === 'lisa' ? '/images/lisa-golf.png' : '/images/anna-giadung.png'}
                    alt={`Ảnh đại diện ${config.name}`}
                    width={80}
                    height={80}
                    className="absolute top-2 right-2 rounded-lg shadow-md border border-gray-200"
                  />
                )}
              </div>
            ) : (
              <span className="text-gray-900">{msg.text}</span>
            )}
          </div>
        ))}

        {loading && (
          <div
            className={`self-start flex items-center gap-2 px-3 py-2 rounded-lg max-w-[60%] ${
              agent === 'lisa' ? 'bg-blue-50' : 'bg-green-50'
            }`}
          >
            <Image
              src="/images/ai-logo-icon.png"
              alt="AItrify Logo"
              width={40}
              height={40}
              className="mr-2 rounded-full"
            />
            <div className="flex gap-1">
              <span className="animate-bounce delay-0 w-2 h-2 bg-gray-500 rounded-full"></span>
              <span className="animate-bounce delay-150 w-2 h-2 bg-gray-500 rounded-full"></span>
              <span className="animate-bounce delay-300 w-2 h-2 bg-gray-500 rounded-full"></span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={`Bạn muốn hỏi gì ${config.name}?`}
          className="flex-1 border rounded-md px-4 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-900 placeholder:text-blue-300"
        />
        <button
          onClick={sendMessage}
          className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm sm:text-base"
        >
          Gửi
        </button>
      </div>
    </div>
  );
}
