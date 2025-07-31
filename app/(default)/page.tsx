// app/(default)/page.tsx

import ClientPage from './ClientPage'; // ⬅️ DÒNG BỊ THIẾU

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
        url: "/og-image.png",
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

export default function HeroHome() {
  return <ClientPage />;
}
