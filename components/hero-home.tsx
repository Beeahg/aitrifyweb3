'use client';

import { useState } from "react"; // quản lý selectedAgent
import VideoThumb from "@/public/images/hero-image-01.jpg";
import Chatbox from "@/components/chatbox";

export default function Hero({ agent }: { agent: string }) {
  const [selectedAgent, setSelectedAgent] = useState<'anna' | 'lisa'>(agent === 'lisa' ? 'lisa' : 'anna');

  const handleAgentSelect = (agent: 'anna' | 'lisa') => {
    setSelectedAgent(agent);
  };

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
                AItrify tái định nghĩa Thương mại điện tử "eCommerce", nơi người Việt mua sắm trực tuyến
                với sự hỗ trợ của Trí tuệ nhân tạo AI, chúng tôi gọi đó là <strong className="font-bold text-indigo-100">AI.Commerce</strong>
              </p>
              <div className="mx-auto max-w-xs sm:flex sm:max-w-none sm:justify-center">
                <div data-aos="fade-up" data-aos-delay={400}>
                  <button
                    onClick={() => handleAgentSelect('anna')}
                    className="btn group mb-4 w-full bg-gradient-to-r from-green-400 to-green-800 text-white hover:from-green-500 hover:to-green-600 sm:mb-0 sm:w-auto"
                  >
                    <span className="relative inline-flex items-center gap-2">
                      {/* Icon điều hòa hoặc gia dụng */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M3 6h18v2H3zM3 10h18v2H3zM3 14h10v2H3zM10 18h4v2h-4z" />
                      </svg>
                      ANNA Điều hòa & Gia dụng
                    </span>
                  </button>
                </div>
                <div data-aos="fade-up" data-aos-delay={600}>
                  <button
                    onClick={() => handleAgentSelect('lisa')}
                    className="btn w-full bg-gradient-to-r from-blue-400 to-blue-800 text-white hover:from-blue-800 hover:to-blue-600 sm:ml-4 sm:w-auto"
                  >
                    <span className="inline-flex items-center gap-2">
                      {/* Icon gậy golf */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M13 2v8.76l6.09-2.44A1 1 0 0 1 21 9.24V11a1 1 0 0 1-.67.94l-7 2.8V20a1 1 0 0 1-2 0v-5.19l-3.44 1.38a1 1 0 0 1-.76-1.86L11 12.24V2a1 1 0 0 1 2 0z" />
                      </svg>
                      LISA Golf & Golfer
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Chatbox component with selectedAgent passed */}
          <Chatbox agent={selectedAgent} />
        </div>
      </div>
    </section>
  );
}
