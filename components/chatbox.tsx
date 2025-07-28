'use client';

import { useEffect, useRef, useState } from 'react';

type Mode = 'default' | 'air' | 'golf';

export default function Chatbox() {
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([
    { sender: 'ai', text: '🤖 AItrify chào bạn, tôi có thể giúp gì hôm nay?' },
  ]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('default');
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

  const handleModeSwitch = (newMode: Mode) => {
    setMode(newMode);

    let intro1 = '';
    let intro2 = '';

    if (newMode === 'air') {
      intro1 = '🧊 AI chatbot giúp bạn mua Điều hòa gia dụng';
      intro2 = '🤖 AItrify chào bạn, bạn muốn mua gì, tôi có thể tư vấn cho bạn hiện tại với hãng Nagakawa';
    } else if (newMode === 'golf') {
      intro1 = '⛳ AItrify LISA Golf chào bạn, tôi có thể giúp gì cho bạn về Golf?';
    }

    const newMessages = [];
    if (intro1) newMessages.push({ sender: 'ai', text: intro1 });
    if (intro2) newMessages.push({ sender: 'ai', text: intro2 });

    setMessages(newMessages);
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-md p-4 flex flex-col gap-4">
      {/* 🔘 Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 justify-center mb-2">
        <button
          onClick={() => handleModeSwitch('air')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            mode === 'air' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'
          }`}
        >
          AItrify–Điều hòa gia dụng
        </button>
        <button
          onClick={() => handleModeSwitch('golf')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            mode === 'golf' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'
          }`}
        >
          AItrify–Dành cho Golf
        </button>
      </div>

      {/* ✅ Gộp chat + input cùng layout đồng bộ */}
      <div className="flex flex-col gap-3 w-full">
        {/* 💬 Chat messages */}
        <div className="max-h-72 overflow-y-auto space-y-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`rounded-lg px-3 py-2 w-fit max-w-full sm:max-w-[80%] text-sm sm:text-base ${
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

        {/* ✍️ Input + Gửi */}
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Gõ câu hỏi của bạn..."
            className="flex-1 border rounded-md px-4 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button
            onClick={sendMessage}
            className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm sm:text-base"
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}
