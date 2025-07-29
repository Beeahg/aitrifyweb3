// app/page.tsx

export const metadata = {
  title: "AItrify",
  description: "Recharging eCommerce with AI",
  openGraph: {
    title: "AItrify - Recharging eCommerce with AI",
    description: "Tìm kiếm và mua sắm thông minh hơn với AItrify",
    url: "https://aitrifyweb3.pages.dev",
    siteName: "AItrify",
    images: [
      {
        url: "/og-image.png", // đảm bảo file này nằm trong thư mục public/
        width: 1200,
        height: 630,
        alt: "AItrify Open Graph Image",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AItrify",
    description: "Tìm kiếm và mua sắm thông minh hơn với AItrify",
    images: ["/og-image.png"],
  },
};

import PageIllustration from "@/components/page-illustration";
import Hero from "@/components/hero-home";
import Workflows from "@/components/workflows";
import Features from "@/components/features";
import Testimonials from "@/components/testimonials";
import Cta from "@/components/cta";

export default function Home() {
  return (
    <>
      <PageIllustration />
      <Hero />
      <Workflows />
      <Features />
      <Testimonials />
      <Cta />
    </>
  );
}
