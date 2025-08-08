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

  const [chatboxExpanded, setChatboxExpanded] = useState(false);

  // Load trạng thái maximize từ localStorage khi khởi tạo
  useEffect(() => {
    const savedExpandState = localStorage.getItem('aitrify_chatbox_expanded');
    if (savedExpandState === 'true') {
      setChatboxExpanded(true);
    }
  }, []);

  const handleToggleExpand = () => {
    const newState = !chatboxExpanded;
    setChatboxExpanded(newState);
    localStorage.setItem('aitrify_chatbox_expanded', newState.toString());
  };

  const messages = chatHistories[agent] || [];

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading, agent]);

  const typewriterEffect = async (fullText: string) => {
    return new Promise<void>((resolve) => {
      let index = 0;

      const interval = setInterval(() => {
        setChatHistories((prev) => {
          const current = prev[agent] || [];
          const last = current[current.length - 1];

          if (!last || last.sender !== 'ai') {
            return {
              ...prev,
              [agent]: [...current, { sender: 'ai', text: fullText.charAt(index) }],
            };
          } else {
            const updatedLast = { ...last, text: last.text + fullText.charAt(index) };
            return {
              ...prev,
              [agent]: [...current.slice(0, -1), updatedLast],
            };
          }
        });

        index++;
        if (index >= fullText.length) {
          clearInterval(interval);
          resolve();
        }
      }, 20); // tốc độ đánh máy
    });
  };

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

    await typewriterEffect(aiResponse);

    setLoading(false);
  };

  const mockChatAPI = async (userInput: string) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userInput,
          user_login: USER_LOGIN,
          agent: agent,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Không thể kết nối tới máy chủ AI.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let partial = '';
      let fullText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        partial += chunk;

        const lines = partial.split('\n\n');
        partial = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const text = line.replace(/^data:\s*/, '');
            fullText += text;
            await typewriterEffect(text);
          }
        }
      }

      return fullText || 'AItrify: Không có nội dung trả về.';
    } catch (err) {
      return '❌ Lỗi kết nối server: ' + (err as Error).message;
    }
  };

  return (
    <div
      className={`relative w-full ${chatboxExpanded ? 'max-w-full' : 'max-w-3xl'} mx-auto rounded-xl border ${config.color} backdrop-blur shadow-lg p-4 flex flex-col gap-4 transition-all duration-300`}
    >
      {/* ✅ NÚT MAXIMIZE / MINIMIZE */}
      <button
        onClick={handleToggleExpand}
        className="absolute top-3 right-3 p-1 rounded-full bg-white/80 hover:bg-white/90 shadow-lg border border-gray-300 text-gray-700"
        title={chatboxExpanded ? 'Thu nhỏ khung chat' : 'Phóng to khung chat'}
      >
        <span className="text-lg font-bold">
          {chatboxExpanded ? '−' : '+'}
        </span>
      </button>

      {/* ✅ PHẦN CHAT */}
      <div
        ref={chatContainerRef}
        className={`overflow-y-auto space-y-2 mb-2 ${chatboxExpanded ? 'max-h-[70vh]' : 'max-h-72'}`}
      >
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
            {msg.sender === 'ai' && (
              <Image
                src="/images/ai-logo-icon.png"
                alt="AItrify Logo"
                width={40}
                height={40}
                className="mr-2 rounded-full"
              />
            )}
            <span
              className="text-gray-900 whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br>') }}
            />
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
