'use client';

import PageIllustration from "@/components/page-illustration";
import HeroHome from "@/components/hero-home";
import Workflows from "@/components/workflows";
import Features from "@/components/features";
import Testimonials from "@/components/testimonials";
import Cta from "@/components/cta";

export default function ClientPage() {
  return (
    <>
      <PageIllustration />
      <HeroHome agent="anna" />
      <Workflows />
      <Features />
      <Testimonials />
      <Cta />
    </>
  );
}
