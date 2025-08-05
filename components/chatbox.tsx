'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface ChatboxProps {
  agent: string;
}

const API_URL = 'https://ai.aitrify.com/ask_stream';
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

    // ✅ GỌI API STREAM
    await streamChatAPI(input);

    setLoading(false);

  };


  const streamChatAPI = async (userInput: string) => {
    try {
      const response = await fetch(`${API_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userInput,
          user_login: USER_LOGIN,
          agent: agent,
        }),
      });

      if (!response.ok) throw new Error(`Lỗi server: ${response.status}`);
      if (!response.body) throw new Error("Không có phản hồi từ server");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let partial = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        partial += decoder.decode(value, { stream: true });

        const chunks = partial.split('\n\n');
        partial = chunks.pop() || '';

        for (const chunk of chunks) {
          if (chunk.trim().startsWith('data: ')) {
            const aiText = chunk.slice(6).trim(); // Lấy nội dung chính xác từ 'data: '

            setChatHistories((prev) => {
              const current = prev[agent] || [];
              const last = current[current.length - 1];

              // Tùy chọn 1: Nối thành 1 tin nhắn dài
              if (last && last.sender === 'ai') {
                const updatedLast = { ...last, text: last.text + '\n' + aiText };
                return {
                  ...prev,
                  [agent]: [...current.slice(0, -1), updatedLast],
                };
              }
              // Tùy chọn 2: Tạo tin nhắn mới cho mỗi chunk (bỏ comment dòng dưới nếu muốn dùng)
              // return { ...prev, [agent]: [...current, { sender: 'ai', text: aiText }] };

              return {
                ...prev,
                [agent]: [...current, { sender: 'ai', text: aiText }],
              };
            });
            console.log("📥 AI chunk:", aiText);
            await new Promise(resolve => setTimeout(resolve, 60)); // Hiệu ứng gõ
          }
        }
      }
    } catch (error) {
      console.error(error);
      setChatHistories((prev) => ({
        ...prev,
        [agent]: [...(prev[agent] || []), { sender: 'ai', text: 'Lỗi khi kết nối AItrify: ' + (error as Error).message }],
      }));
    }
  };


  // const mockChatAPI = async (userInput: string) => {
  //   try {
  //     const response = await fetch(API_URL, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         question: userInput,
  //         user_login: USER_LOGIN,
  //         agent: agent,
  //       }),
  //     });
  //     if (!response.ok) throw new Error('Lỗi server');
  //     const data = await response.json();
  //     return data.answer || 'Trả lời từ AI: ' + JSON.stringify(data);
  //   } catch (error) {
  //     return 'Lỗi kết nối server: ' + (error as Error).message;
  //   }
  // };

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
