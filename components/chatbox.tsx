'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const API_URL = "https://ai.aitrify.com/ask";
const USER_LOGIN = "mock_user"



export default function Chatbox() {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([
    { sender: 'ai', text: 'AItrify chào bạn, tôi có thể giúp gì hôm nay?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // useEffect(() => {
  //   chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [messages, loading]);
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);


  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true); // bắt đầu loading "..."
    
    const aiResponse = await mockChatAPI(input);
    setLoading(false); // tắt loading
    const aiMessage = { sender: 'ai', text: aiResponse };
    setMessages((prev) => [...prev, aiMessage]);
  };

  // const mockChatAPI = async (userInput: string) => {
  //   return new Promise<string>((resolve) => {
  //     setTimeout(() => {
  //       resolve(`Trả lời cho: "${userInput}"`);
  //     }, 1500);
  //   });
  // };
  const mockChatAPI = async (userInput: string) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userInput, user_login: USER_LOGIN }),
      });
      if (!response.ok) throw new Error('Lỗi server');
      const data = await response.json();
      return data.answer || 'Trả lời từ AI: ' + JSON.stringify(data); // Lấy 'answer' từ response, fallback nếu lỗi
    } catch (error) {
      return 'Lỗi kết nối server: ' + (error as Error).message;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto rounded-xl border border-gray-200 bg-white/90 backdrop-blur shadow-lg p-4 flex flex-col gap-4">
      <div ref={chatContainerRef} className="max-h-72 overflow-y-auto space-y-2 mb-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`rounded-lg px-3 py-2 max-w-[80%] text-sm sm:text-base ${
              msg.sender === 'user'
                ? 'bg-indigo-100 self-end ml-auto text-right'
                : 'bg-indigo-50 self-start flex items-center gap-2'
            }`}
          >
            {msg.sender === 'ai' && (
              <Image
                src="/images/ai-logo-icon.png"
                alt="AItrify Logo"
                width={40}
                height={40}
                className="mr-2 rounded-full"
              />
            )}
            <span className="text-gray-900">{msg.text}</span>
          </div>
        ))}

        {/* Bong bóng "đang gõ..." */}
        {loading && (
          <div className="bg-indigo-50 self-start flex items-center gap-2 px-3 py-2 rounded-lg max-w-[60%]">
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
          placeholder="Bạn cần mua gì từ AItrify, mời bạn gõ câu hỏi và nhấn nút 'Gửi' hoặc gõ Enter..."
          className="flex-1 border rounded-md px-4 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-900 placeholder:text-blue-200"
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
