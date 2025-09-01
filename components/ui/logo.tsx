// app/components/Logo.tsx

import Link from "next/link";
import Image from "next/image";
import logo from "@/public/images/logo.png";

export default function Logo() {
  return (
    <Link
      href="/"
      className="inline-flex items-center shrink-0"
      aria-label="AItrify"
    >
      <Image
        src={logo}
        alt="AItrify Logo"
        width={180}   //  có thể tăng lên 220 nếu header còn rộng
        height={70}   // giữ đúng tỷ lệ gốc hoặc bỏ height để Next tự co
        priority
      />
    </Link>
  );
}
