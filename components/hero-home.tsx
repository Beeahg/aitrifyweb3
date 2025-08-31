'use client';

import { useEffect, useRef, useState } from 'react';
import Chatbox from '@/components/chatbox';

type Agent = 'anna' | 'lisa';

export default function Hero({ agent }: { agent: string }) {
  // agent từ props -> chuẩn hoá thành 'anna' | 'lisa'
  const initial: Agent = agent === 'lisa' ? 'lisa' : 'anna';
  const [selectedAgent, setSelectedAgent] = useState<Agent>(initial);

  // ref để cuộn tới vùng chat
  const chatRef = useRef<HTMLDivElement>(null);

  // Bấm nút ANNA/LISA ở hero
  const handleAgentSelect = (ag: Agent) => {
    setSelectedAgent(ag);
    // cuộn tới khung chat
    setTimeout(() => {
      chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  // Nhận tín hiệu từ footer: window.dispatchEvent(new CustomEvent('aitrify:pick-agent', { detail: { agent: 'anna' | 'lisa' } }))
  useEffect(() => {
    const onPick = (e: Event) => {
      const ag = ((e as CustomEvent).detail?.agent || 'anna') as Agent;
      setSelectedAgent(ag);
      setTimeout(() => {
        chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 30);
    };
    window.addEventListener('aitrify:pick-agent', onPick as EventListener);
    return () =>
      window.removeEventListener('aitrify:pick-agent', onPick as EventListener);
  }, []);

  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Hero content */}
        <div className="py-12 md:py-20">
          {/* Section header */}
          <div className="pb-12 text-center md:pb-20">
            <h1
              className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-5 font-nacelle text-4xl font-semibold text-transparent md:text-5xl"
              data-aos="fade-up"
            >
              AItrify - Recharging eCommerce with A.I
            </h1>

            <div className="mx-auto max-w-3xl">
              <p
                className="mb-8 text-xl text-indigo-100/80"
                data-aos="fade-up"
                data-aos-delay={200}
              >
                AItrify tái định nghĩa Thương mại điện tử "eCommerce", nơi dành cho
                người Việt mua sắm trực tuyến với sự hỗ trợ của Trí tuệ nhân tạo AI,
                chúng tôi gọi đó là{' '}
                <strong className="font-bold text-indigo-100">AI.Commerce</strong>
              </p>

              <div className="mx-auto flex max-w-full flex-wrap justify-center gap-3 sm:flex-nowrap">
                {/* Nút ANNA */}
                <div data-aos="fade-up" data-aos-delay={400}>
                  <button
                    onClick={() => handleAgentSelect('anna')}
                    className="btn w-full bg-gradient-to-r from-green-400 to-green-800 text-white hover:from-green-500 hover:to-green-600 sm:w-auto"
                  >
                    <span className="relative inline-flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 6h18v2H3zM3 10h18v2H3zM3 14h10v2H3zM10 18h4v2h-4z" />
                      </svg>
                      ANNA Điều hòa &amp; Gia dụng
                    </span>
                  </button>
                </div>

                {/* Nút LISA */}
                <div data-aos="fade-up" data-aos-delay={600}>
                  <button
                    onClick={() => handleAgentSelect('lisa')}
                    className="btn w-full bg-gradient-to-r from-blue-400 to-blue-800 text-white hover:from-blue-800 hover:to-blue-600 sm:w-auto"
                  >
                    <span className="inline-flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13 2v8.76l6.09-2.44A1 1 0 0 1 21 9.24V11a1 1 0 0 1-.67.94l-7 2.8V20a1 1 0 0 1-2 0v-5.19l-3.44 1.38a1 1 0  1-.76-1.86L11 12.24V2a1 1 0 0 1 2 0z" />
                      </svg>
                      LISA Golf &amp; Golfer
                    </span>
                  </button>
                </div>

                {/* Nút Mua hàng tại AItrify */}
                <div data-aos="fade-up" data-aos-delay={800}>
                  <button
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent('aitrify:footer', {
                          detail: { topic: 'guide/purchase' },
                        }),
                      )
                    }
                    className="btn w-full bg-gradient-to-r from-yellow-400 to-yellow-700 text-white hover:from-yellow-500 hover:to-yellow-800 sm:w-auto ml-6"
                  >
                    <span className="inline-flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7 4h-2l-3 7v2h2l1 9h14l1-9h2v-2l-3-7h-2l-1 2h-8l-1-2zm2.5 2h5l1 2h-7l1-2zm9 4l1.5 3h-15l1.5-3h12zm-2.5 9c.83 0 1.5-.67 1.5-1.5S16.83 16 16 16s-1.5.67-1.5 1.5S15.17 19 16 19zm-8 0c.83 0 1.5-.67 1.5-1.5S8.83 16 8 16s-1.5.67-1.5 1.5S7.17 19 8 19z" />
                      </svg>
                      Mua hàng tại AItrify
                    </span>
                  </button>
                </div>
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
