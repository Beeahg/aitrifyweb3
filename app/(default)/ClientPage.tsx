'use client';

import { useState } from "react";
import PageIllustration from "@/components/page-illustration";
import HeroHome from "@/components/hero-home";
import Workflows from "@/components/workflows";
import Features from "@/components/features";
import Testimonials from "@/components/testimonials";
import Cta from "@/components/cta";
import Chatbox from "@/components/chatbox";

export default function ClientPage() {
  const [agent, setAgent] = useState<'anna' | 'lisa'>('anna');

  return (
    <>
      <PageIllustration />

      {/* Nút chuyển giữa 2 agent */}
      <div className="flex justify-center gap-4 my-4">
        <button
          onClick={() => setAgent('anna')}
          className={`px-4 py-2 rounded-md border font-semibold ${
            agent === 'anna' ? 'bg-green-200 border-green-500' : 'bg-white'
          }`}
        >
          ANNA Gia dụng
        </button>
        <button
          onClick={() => setAgent('lisa')}
          className={`px-4 py-2 rounded-md border font-semibold ${
            agent === 'lisa' ? 'bg-blue-200 border-blue-500' : 'bg-white'
          }`}
        >
          LISA Golf
        </button>
      </div>

      {/* Truyền agent cho HeroHome */}
      <HeroHome agent={agent} />

      {/* Các thành phần khác */}
      <Workflows />
      <Features />
      <Testimonials />
      <Cta />

      {/* Chatbox của AItrify */}
      <div className="my-6">
        <Chatbox agent={agent} />
      </div>
    </>
  );
}
