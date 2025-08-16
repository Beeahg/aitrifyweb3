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
      'ANNA ở đây để giúp bạn tìm được tiện nghi như điều hòa và thiết bị gia dụng chính hãng kèm dịch vụ chuẩn hãng nhưng giá luôn trong Top Ưu đãi nhất!',
    color: 'bg-green-50 border-green-300',
  },
  lisa: {
    name: 'LISA',
    greeting:
      'Chào Ông/Bà, LISA rất hân hạnh được trợ giúp về Golf, hơn cả một môn thể thao sang trọng, Golf là Đẳng cấp về sự kết nối của những người Thành đạt!',
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

  // const typewriterEffect = async (fullText: string) => {
  //   return new Promise<void>((resolve) => {
  //     let index = 0;

  //     const interval = setInterval(() => {
  //       setChatHistories((prev) => {
  //         const current = prev[agent] || [];
  //         const newMessages = [...current]; // Tạo bản sao để tránh mutate state trực tiếp

  //         if (index === 0) {
  //           // Thay message AI hiện tại bằng ký tự đầu tiên
  //           newMessages[newMessages.length - 1] = { sender: 'ai', text: fullText.charAt(0) };
  //         } else if (index < fullText.length) {
  //           // Ghép các ký tự tiếp theo vào message AI cuối cùng
  //           const lastMessage = newMessages[newMessages.length - 1];
  //           newMessages[newMessages.length - 1] = { sender: 'ai', text: lastMessage.text + fullText.charAt(index) };
  //         }

  //         return {
  //           ...prev,
  //           [agent]: newMessages,
  //         };
  //       });

  //       index++;
  //       if (index >= fullText.length) {
  //         clearInterval(interval);
  //         resolve();
  //       }
  //     }, 20); // tốc độ đánh máy
  //   });
  // };
  
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
  };


  const typewriterEffectSafe = async (fullText: string, messageId: string) => {
    console.count('typewriterEffectSafe called');
    return new Promise<void>((resolve) => {
      const chars = Array.from(fullText);

      // 1) Seed firstChar ngay lập tức
      setChatHistories(prev => {
        const list = prev[agent] || [];
        const idx = list.findIndex(m => (m as any).id === messageId);
        if (idx === -1) return prev;

        const seeded = { ...list[idx], text: (list[idx].text || '') + (chars[0] ?? '') };
        const next = [...list]; next[idx] = seeded;
        return { ...prev, [agent]: next };
      });

      // 2) Gõ từ ký tự thứ 2 trở đi
      let i = 1;
      const timer = setInterval(() => {
        setChatHistories(prev => {
          const list = prev[agent] || [];
          const idx = list.findIndex(m => (m as any).id === messageId);
          if (idx === -1) return prev;

          const curr = list[idx];
          const nextText = (curr.text || '') + (chars[i] ?? '');
          const nextList = [...list];
          nextList[idx] = { ...curr, text: nextText };
          return { ...prev, [agent]: nextList };
        });

        i++;
        if (i >= chars.length) {
          clearInterval(timer);
          resolve();
        }
      }, 20);
    });
  };


  const mockChatAPI = async (userInput: string) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userInput, user_login: USER_LOGIN, agent }),
      });
      if (!response.ok) throw new Error('Không thể kết nối tới máy chủ AI.');

      const rawText = await response.text();
      console.log('Raw Response from BE:', rawText);

      const data = JSON.parse(rawText);
      const answer: string = (data?.answer ?? '').toString();
      console.log('Parsed Answer:', answer);

      // Cắt theo ý anh để bảo đảm có firstChar + phần còn lại
      const chars = Array.from(answer);
      const firstChar = chars[0] ?? '';
      const displayText = chars.slice(1).join('');
      const fullAnswer = firstChar + displayText;

      console.log('First Char:', firstChar);
      console.log('Display Text (thiếu đầu):', displayText);
      console.log('Full Answer:', fullAnswer);

      // Append 1 message AI mới (không đụng các message cũ)
      const messageId = `ai-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setChatHistories(prev => {
        const list = prev[agent] || [];
        return {
          ...prev,
          [agent]: [...list, { id: messageId, sender: 'ai', text: '' }],
        };
      });

      if (fullAnswer) {
        await typewriterEffectSafe(fullAnswer, messageId); // await để không chồng chéo
      }
      return fullAnswer || 'AItrify: Không có nội dung trả về.';
    } catch (err) {
      console.error('Error in mockChatAPI:', (err as Error).message);
      return '❌ Lỗi kết nối server: ' + (err as Error).message;
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
  //     if (!response.ok) {
  //       throw new Error('Không thể kết nối tới máy chủ AI.');
  //     }
  //     // Lấy toàn bộ raw text từ response trước khi parse
  //     const rawText = await response.text();
  //     console.log('Raw Response from BE:', rawText);

  //     // Parse JSON để lấy nội dung answer đầy đủ
  //     const data = JSON.parse(rawText);
  //     const answer = data.answer || '';

  //     // Cắt ký tự đầu và ghép lại theo ý tưởng của bạn
  //     const firstChar = answer.charAt(0); // Ký tự đầu tiên (full)
  //     const displayText = answer.slice(1).trim(); // Chuỗi thiếu đầu
  //     const fullAnswer = firstChar + displayText;

  //     console.log('First Char:', firstChar);
  //     console.log('Display Text (thiếu đầu):', displayText);
  //     console.log('Full Answer:', fullAnswer);

  //     // Reset hoặc tạo mới mục AI trong chatHistories trước khi gọi typewriter
  //     setChatHistories((prev) => ({
  //       ...prev,
  //       [agent]: [...(prev[agent] || []).filter(msg => msg.sender !== 'ai'), { sender: 'ai', text: '' }],
  //     }));

  //     // Gọi typewriter với fullAnswer
  //     if (fullAnswer) {
  //       typewriterEffect(fullAnswer);
  //     }
  //     return fullAnswer || 'AItrify: Không có nội dung trả về.';
  //   } catch (err) {
  //     console.error('Error in mockChatAPI:', (err as Error).message);
  //     return '❌ Lỗi kết nối server: ' + (err as Error).message;
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
            className={`rounded-lg px-3 py-2 max-w-[75%] text-sm sm:text-base whitespace-pre-wrap break-words ${
              msg.sender === 'user'
                ? 'bg-indigo-100 self-end ml-auto text-right'
                : 'self-start flex items-center gap-2 ' +
                  (agent === 'lisa' ? 'bg-blue-50' : 'bg-green-50')
            }`}
            style={{ wordBreak: 'break-word' }} // Đảm bảo từ dài (như số) không bị cắt
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
              className="text-gray-900"
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
