'use client';

import { useEffect, useRef, useState } from 'react';
import Chatbox from '@/components/chatbox';
import PublicMetrics from '@/components/public-metrics';

type Agent = 'anna' | 'lisa' | 'ugreen';

export default function Hero({ agent }: { agent: string }) {
  const initial: Agent = agent === 'lisa' ? 'lisa' : agent === 'ugreen' ? 'ugreen' : 'anna';
  const [selectedAgent, setSelectedAgent] = useState<Agent>(initial);

  const chatRef = useRef<HTMLDivElement>(null);

  const handleAgentSelect = (ag: Agent) => {
    setSelectedAgent(ag);
    setTimeout(() => {
      chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  useEffect(() => {
    const onPick = (e: Event) => {
      const ag = ((e as CustomEvent).detail?.agent || 'anna') as Agent;
      setSelectedAgent(ag);
      setTimeout(() => {
        chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 30);
    };
    window.addEventListener('aitrify:pick-agent', onPick as EventListener);
    return () => window.removeEventListener('aitrify:pick-agent', onPick as EventListener);
  }, []);

  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          <div className="pb-12 text-center md:pb-20">
            <h1
              className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-5 font-nacelle text-4xl font-semibold text-transparent md:text-5xl"
              data-aos="fade-up"
            >
              AItrify – Universal Multi-Agent AI Platform for Enterprise
            </h1>

            <div className="mx-auto max-w-3xl">
              <p className="mb-8 text-xl text-indigo-100/80" data-aos="fade-up" data-aos-delay={200}>
                AItrify xây dựng nền tảng AI đa tác tử chỉ dành cho Doanh nghiệp, nơi Trí tuệ nhân tạo
                không chỉ hiểu câu hỏi mà quan trọng hơn là hiểu Quy trình nghiệp vụ nội bộ Công ty của bạn. Với AItrify, Doanh nghiệp của bạn đã là AA: {' '}
                <strong className="font-bold text-indigo-100">AI Agentic Enterprise</strong>
              </p>
            </div>

            <PublicMetrics />

            <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:flex-row">
                {/* Nút ANNA (đỏ Nagakawa) */}
                <div className="flex-1" data-aos="fade-up" data-aos-delay={400}>
                  <button
                    onClick={() => handleAgentSelect('anna')}
                    className="btn w-full bg-gradient-to-r from-red-600 to-red-800 text-white hover:from-red-700 hover:to-red-900"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 6h18v2H3zM3 10h18v2H3zM3 14h10v2H3zM10 18h4v2h-4z" />
                      </svg>
                      ANNA Điều hòa &amp; Gia dụng
                    </span>
                  </button>
                </div>

                {/* Nút LISA (xanh dương giữ nguyên) */}
                <div className="flex-1" data-aos="fade-up" data-aos-delay={600}>
                  <button
                    onClick={() => handleAgentSelect('lisa')}
                    className="btn w-full bg-gradient-to-r from-blue-400 to-blue-800 text-white hover:from-blue-800 hover:to-blue-600"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13 2v8.76l6.09-2.44A1 1 0 0 1 21 9.24V11a1 1 0 0 1-.67.94l-7 2.8V20a1 1 0 0 1-2 0v-5.19l-3.44 1.38a1 1 0  1-.76-1.86L11 12.24V2a1 1 0 0 1 2 0z" />
                      </svg>
                      LISA Golf &amp; Golfer
                    </span>
                  </button>
                </div>

                {/* Nút UGREEN (xanh lá gradient) */}
                <div className="flex-1" data-aos="fade-up" data-aos-delay={650}>
                  <button
                    onClick={() => handleAgentSelect('ugreen')}
                    className="btn w-full bg-gradient-to-r from-green-400 to-green-800 text-white hover:from-green-500 hover:to-green-600"
                  >
                    <span className="flex items-center justify-center gap-2">
                      {/* ✅ Icon lá xanh */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8 2 4 6 4 10c0 3.31 2.69 6 6 6h1v2H9v2h6v-2h-2v-2h1c3.31 0 6-2.69 6-6 0-4-4-8-8-8zM7 10c0-2.76 2.24-5 5-5s5 2.24 5 5-2.24 5-5 5-5-2.24-5-5z"/>
                      </svg>
                      UGREEN Xanh
                    </span>
                  </button>
                </div>

                {/* Nút Mua hàng */}
                <div className="flex-1" data-aos="fade-up" data-aos-delay={800}>
                  <button
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent('aitrify:footer', {
                          detail: { topic: 'guide/purchase' },
                        }),
                      )
                    }
                    className="btn w-full bg-gradient-to-r from-yellow-400 to-yellow-700 text-white hover:from-yellow-500 hover:to-yellow-800"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7 4h-2l-3 7v2h2l1 9h14l1-9h2v-2l-3-7h-2l-1 2h-8l-1-2zm2.5 2h5l1 2h-7l1-2zm9 4l1.5 3h-15l1.5-3h12zm-2.5 9c.83 0 1.5-.67 1.5-1.5S16.83 16 16 16s-1.5.67-1.5 1.5S15.17 19 16 19zm-8 0c.83 0 1.5-.67 1.5-1.5S8.83 16 8 16s-1.5.67-1.5 1.5S7.17 19 8 19z" />
                      </svg>
                      Mua hàng với AItrify
                    </span>
                  </button>
                </div>
              </div>
          </div>

          {/* Chatbox */}
          <div ref={chatRef}>
            <Chatbox agent={selectedAgent} />
          </div>
        </div>
      </div>
    </section>
  );
}
