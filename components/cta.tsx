'use client';

import Image from 'next/image';
import BlurredShape from '@/public/images/blurred-shape.svg';

type Agent = 'anna' | 'lisa' | 'ugreen';

export default function Cta() {
  const pickAgent = (agent: Agent) => {
    // Cuộn lên đầu trang
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Báo cho Hero/Hero-Home đổi agent và cuộn tới Chatbox
    window.dispatchEvent(
      new CustomEvent('aitrify:pick-agent', { detail: { agent } })
    );
  };

  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -z-10 -mb-24 ml-20 -translate-x-1/2"
        aria-hidden="true"
      >
        <Image
          className="max-w-none"
          src={BlurredShape}
          width={760}
          height={668}
          alt="Blurred shape"
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="bg-linear-to-r from-transparent via-gray-800/50 py-12 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2
              className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-8 font-nacelle text-3xl font-semibold text-transparent md:text-4xl"
              data-aos="fade-up"
            >
              Mua hàng cùng AI trên AItrify
            </h2>

            <div className="mx-auto max-w-xs sm:flex sm:max-w-none sm:justify-center">
              {/* Hàng Gia dụng -> ANNA */}
              <div data-aos="fade-up" data-aos-delay={400}>
                <button
                  type="button"
                  onClick={() => pickAgent('anna')}
                  className="btn relative w-full mb-4 sm:mb-0 bg-linear-to-t from-red-600 to-red-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%] sm:mb-0 sm:w-auto"
                >
                  Hàng Gia dụng →
                </button>
              </div>

              {/* Hàng cho Golfer -> LISA */}
              <div data-aos="fade-up" data-aos-delay={600}>
                <button
                  type="button"
                  onClick={() => pickAgent('lisa')}
                  className="btn relative w-full mb-4 sm:mb-0 bg-linear-to-b from-blue-600 to-blue-500/60 bg-[length:100%_100%] bg-[bottom] text-gray-300 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] hover:bg-[length:100%_150%] sm:ml-4 sm:w-auto"
                >
                  Hàng cho Golfer
                </button>
              </div>

              {/* Hàng hóa Xanh -> UGREEN */}
              <div data-aos="fade-up" data-aos-delay={800}>
                <button
                  type="button"
                  onClick={() => {
                    pickAgent('ugreen');
                    document.getElementById('ugreen-greeting')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="btn relative w-full mb-4 sm:mb-0 bg-linear-to-b from-green-600 to-green-500 bg-[length:100%_100%] bg-[bottom] text-white hover:bg-[length:100%_150%] sm:ml-4 sm:w-auto"
                >
                  Hàng hóa Xanh
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
