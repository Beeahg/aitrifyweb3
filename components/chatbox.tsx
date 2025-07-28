'use client';

import { useEffect, useRef, useState } from 'react';

export default function Chatbox() {
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([
    { sender: 'ai', text: '🤖 Trợ lý A.I thương mại điện tử AItrify luôn sẵn sàng phục vụ bạn, bạn cần gì bây giờ?' }
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    const aiResponse = await mockChatAPI(input);
    const aiMessage = { sender: 'ai', text: aiResponse };
    setMessages((prev) => [...prev, aiMessage]);
  };

  const mockChatAPI = async (userInput: string) => {
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(`🤖 Trả lời cho: "${userInput}"`);
      }, 1000);
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-md p-4">
      <div className="max-h-80 overflow-y-auto space-y-2 mb-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`rounded-lg px-3 py-2 max-w-[80%] ${
              msg.sender === 'user'
                ? 'bg-indigo-100 self-end ml-auto text-right'
                : 'bg-gray-200 self-start'
            }`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Gõ câu hỏi của bạn..."
          className="flex-1 border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <button
          onClick={sendMessage}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Gửi
        </button>
      </div>
    </div>
  );
}
