'use client';

import { useEffect, useRef, useState } from 'react';
import Chatbox from '@/components/chatbox';
import PublicMetrics from '@/components/public-metrics';

type Agent = 'anna' | 'lisa' | 'green' | 'lega' | 'mobi' | 'aifi';

export default function Hero({ agent }: { agent: string }) {
  const initial: Agent = agent === 'lisa' ? 'lisa' : agent === 'green' ? 'green' : 'anna';
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
                <strong className="font-bold text-indigo-100">AI Agentic Enterprise</strong>.
              </p>
              <div className="mt-5 mb-8 flex flex-col items-center gap-2 text-center" data-aos="fade-up" data-aos-delay={250}>
                <p className="flex items-center justify-center gap-2 text-base font-medium">
                  <span className="text-indigo-200/70">Phát triển bởi</span>
                  <svg width="36" height="32" viewBox="0 0 40 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="20,0 27.8,4.5 27.8,13.5 20,18 12.2,13.5 12.2,4.5" fill="#EAB308"/>
                    <polygon points="13,14 20.8,18.5 20.8,27.5 13,32 5.2,27.5 5.2,18.5" fill="#EAB308" opacity="0.85"/>
                    <polygon points="27,14 34.8,18.5 34.8,27.5 27,32 19.2,27.5 19.2,18.5" fill="#EAB308" opacity="0.85"/>
                  </svg>
                  <span className="font-semibold text-white">Bee Systems Inc.</span>
                </p>
                <a
                  href="https://www.beeinc.vn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,#a5b4fc,#c4b5fd,#e0e7ff,#818cf8,#a5b4fc)] bg-[length:200%_auto] bg-clip-text text-lg font-semibold text-transparent hover:opacity-80 transition-opacity"
                >
                  www.beeinc.vn →
                </a>
              </div>
            </div>

            <PublicMetrics />

            <div className="mx-auto grid w-full max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3">
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
                    onClick={() => handleAgentSelect('green')}
                    className="btn w-full bg-gradient-to-r from-green-400 to-green-800 text-white hover:from-green-500 hover:to-green-600"
                  >
                    <span className="flex items-center justify-center gap-2">
                      {/* ✅ Icon lá xanh */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8 2 4 6 4 10c0 3.31 2.69 6 6 6h1v2H9v2h6v-2h-2v-2h1c3.31 0 6-2.69 6-6 0-4-4-8-8-8zM7 10c0-2.76 2.24-5 5-5s5 2.24 5 5-2.24 5-5 5-5-2.24-5-5z"/>
                      </svg>
                      GREEN Xanh
                    </span>
                  </button>
                </div>

                {/* Nút Mua hàng - ẩn tạm */}
                <div className="hidden" data-aos="fade-up" data-aos-delay={800}>
                  <button className="btn w-full bg-gradient-to-r from-yellow-400 to-yellow-700 text-white">
                    <span>Mua hàng với AItrify</span>
                  </button>
                </div>
                {/* Nút LEGA (tím) */}
                <div data-aos="fade-up" data-aos-delay={700}>
                  <button
                    onClick={() => handleAgentSelect('lega')}
                    className="btn w-full bg-gradient-to-r from-violet-500 to-purple-700 text-white hover:from-violet-600 hover:to-purple-800"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                      </svg>
                      LEGA Pháp lý
                    </span>
                  </button>
                </div>
                {/* Nút MOBI (cam) */}
                <div data-aos="fade-up" data-aos-delay={750}>
                  <button
                    onClick={() => handleAgentSelect('mobi')}
                    className="btn w-full bg-gradient-to-r from-orange-400 to-orange-700 text-white hover:from-orange-500 hover:to-orange-800"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17 2H7C5.9 2 5 2.9 5 4v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 18c-.83 0-1.5-.67-1.5-1.5S11.17 17 12 17s1.5.67 1.5 1.5S12.83 20 12 20zm5-4H7V4h10v12z"/>
                      </svg>
                      MOBI Di động
                    </span>
                  </button>
                </div>
                {/* Nút AIFI (xanh ngọc) */}
                <div data-aos="fade-up" data-aos-delay={800}>
                  <button
                    onClick={() => handleAgentSelect('aifi')}
                    className="btn w-full bg-gradient-to-r from-cyan-400 to-teal-700 text-white hover:from-cyan-500 hover:to-teal-800"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                      </svg>
                      AIFI Tài chính
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
