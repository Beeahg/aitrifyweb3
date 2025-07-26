'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';

export default function ModalChat() {
  const [modalOpen, setModalOpen] = useState<boolean>(true);
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cuộn xuống cuối khi có tin nhắn mới
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Gọi API trả lời từ AI (giả lập hoặc thật tuỳ bạn cấu hình sau này)
    const aiResponse = await mockChatAPI(input);
    const aiMessage = { sender: 'ai', text: aiResponse };
    setMessages((prev) => [...prev, aiMessage]);
  };

  const mockChatAPI = async (userInput: string) => {
    // Bạn có thể thay bằng real API fetch tại đây
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(`🤖 Trả lời cho: "${userInput}"`);
      }, 1000);
    });
  };

  return (
    <Dialog initialFocus={chatEndRef} open={modalOpen} onClose={() => setModalOpen(false)}>
      <DialogBackdrop className="fixed inset-0 z-50 bg-black/70 transition-opacity" />
      <div className="fixed inset-0 z-50 flex px-4 py-6 sm:px-6">
        <div className="mx-auto flex h-full max-w-4xl items-center">
          <DialogPanel className="aspect-video max-h-full w-full overflow-hidden rounded-2xl bg-white shadow-2xl p-4 flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg px-3 py-2 max-w-[70%] ${
                    msg.sender === 'user'
                      ? 'bg-indigo-100 self-end text-right'
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
                className="flex-1 border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="AItrify mời Gõ câu hỏi của bạn..."
              />
              <button
                onClick={sendMessage}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Gửi
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
