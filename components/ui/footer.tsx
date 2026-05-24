import Logo from "./logo";
import Image from "next/image";
import FooterIllustration from "@/public/images/footer-illustration.svg";

export default function Footer() {
  const dispatchFooter = (topic: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("aitrify:footer", { detail: { topic } }));
    }
  };

  return (
    <footer>
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Footer illustration */}
        <div
          className="pointer-events-none absolute bottom-0 left-1/2 -z-10 -translate-x-1/2"
          aria-hidden="true"
        >
          <Image
            className="max-w-none"
            src={FooterIllustration}
            width={1076}
            height={378}
            alt="Footer illustration"
          />
        </div>

        <div className="grid grid-cols-2 gap-12 justify-start text-left py-8 sm:grid-rows-[auto_auto] md:grid-cols-4 md:grid-rows-[auto_auto] md:py-12 lg:grid-cols-[repeat(4,minmax(0,140px))_1fr] lg:grid-rows-1 xl:gap-20">

          {/* 1st block — Sản phẩm & Dịch vụ */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-200">Sản phẩm &amp; Dịch vụ</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  className="text-indigo-200/65 transition hover:text-indigo-500"
                  onClick={() => dispatchFooter("features")}
                >
                  Tính năng
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-indigo-200/65 transition hover:text-indigo-500"
                  onClick={() => dispatchFooter("integrations")}
                >
                  Tích hợp
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-indigo-200/65 transition hover:text-indigo-500"
                  onClick={() => dispatchFooter("pricing")}
                >
                  Gói dịch vụ
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-indigo-200/65 transition hover:text-indigo-500"
                  onClick={() => dispatchFooter("brands")}
                >
                  Hãng sản xuất
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-indigo-200/65 transition hover:text-indigo-500"
                  onClick={() => dispatchFooter("policies")}
                >
                  Chính sách
                </button>
              </li>
            </ul>
          </div>

          {/* 2nd block — Công ty */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-200">Công ty</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  className="text-indigo-200/65 transition hover:text-indigo-500"
                  onClick={() => dispatchFooter("about")}
                >
                  Về AItrify
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-indigo-200/65 transition hover:text-indigo-500"
                  onClick={() => dispatchFooter("vision")}
                >
                  Tầm nhìn AItrify 
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-indigo-200/65 transition hover:text-indigo-500"
                  onClick={() => dispatchFooter("technology")}
                >
                  Công nghệ AItrify
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-indigo-200/65 transition hover:text-indigo-500"
                  onClick={() => dispatchFooter("careers")}
                >
                  Tuyển dụng
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-indigo-200/65 transition hover:text-indigo-500"
                  onClick={() => dispatchFooter("investors")}
                >
                  Nhà đầu tư
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-indigo-200/65 transition hover:text-indigo-500"
                  onClick={() => dispatchFooter("partners")}
                >
                  Dành cho Hãng
                </button>
              </li>
            </ul>
          </div>

          {/* 3rd block — Thông tin */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-200">Thông tin</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  className="text-indigo-200/65 transition hover:text-indigo-500"
                  onClick={() => dispatchFooter("eua")}
                >
                  Thỏa thuận EUA
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-indigo-200/65 transition hover:text-indigo-500"
                  onClick={() => dispatchFooter("terms")}
                >
                  Điều khoản dịch vụ
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-indigo-200/65 transition hover:text-indigo-500"
                  onClick={() => dispatchFooter("privacy")}
                >
                  Chính sách bảo mật
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-indigo-200/65 transition hover:text-indigo-500"
                  onClick={() => dispatchFooter("disclaimer")}
                >
                  Tuyên bố miễn trừ
                </button>
              </li>
            </ul>
          </div>

          {/* 4th block — Hướng dẫn sử dụng */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-200">Hướng dẫn sử dụng</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  className="text-indigo-200/65 transition hover:text-indigo-500"
                  onClick={() => dispatchFooter("guide/getting-started")}
                >
                  Sử dụng AItrify
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-indigo-200/65 transition hover:text-indigo-500"
                  onClick={() => dispatchFooter("guide/signup")}
                >
                  Đăng ký AItrify
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-indigo-200/65 transition hover:text-indigo-500"
                  onClick={() => dispatchFooter("guide/purchase")}
                >
                  Mua hàng với AItrify
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-indigo-200/65 transition hover:text-indigo-500"
                  onClick={() => dispatchFooter("guide/search")}
                >
                  Tìm kiếm với AItrify
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-indigo-200/65 transition hover:text-indigo-500"
                  onClick={() => dispatchFooter("guide/partner")}
                >
                  Hợp tác với AItrify
                </button>
              </li>
            </ul>
          </div>

          {/* 5th block — Logo & info */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 text-left lg:text-right">
            <div className="mb-3">
              <Logo />
            </div>
            <div className="mt-4 flex flex-col items-end gap-2">
              <p className="flex flex-wrap items-center justify-end gap-1.5 text-sm font-medium text-indigo-200/70">
                <span className="whitespace-nowrap">Phát triển bởi</span>
                <svg width="20" height="18" viewBox="0 0 40 35" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                  <polygon points="20,0 27.8,4.5 27.8,13.5 20,18 12.2,13.5 12.2,4.5" fill="#EAB308"/>
                  <polygon points="13,14 20.8,18.5 20.8,27.5 13,32 5.2,27.5 5.2,18.5" fill="#EAB308" opacity="0.85"/>
                  <polygon points="27,14 34.8,18.5 34.8,27.5 27,32 19.2,27.5 19.2,18.5" fill="#EAB308" opacity="0.85"/>
                </svg>
                <span className="whitespace-nowrap font-semibold text-white">Bee Systems Inc.</span>
              </p>
              <a
                href="https://www.beeinc.vn"
                target="_blank"
                rel="noopener noreferrer"
                className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,#a5b4fc,#c4b5fd,#e0e7ff,#818cf8,#a5b4fc)] bg-[length:200%_auto] bg-clip-text text-sm font-semibold text-transparent hover:opacity-80 transition-opacity"
              >
                www.beeinc.vn →
              </a>
              <div className="mt-1 border-t border-white/10 pt-2 text-right">
                <a
                  href="https://vietnamtrademark.net/aitrify-tm_4-2024-22427_pmhkvdtjy2k"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-end gap-1 text-xs text-amber-400/75 hover:text-amber-400 transition-colors"
                >
                  <span className="text-sm">™</span>
                  <span>Nhãn hiệu Altrify của Bee Systems được bảo hộ</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <p className="mt-1 text-[11px] leading-relaxed text-white/30">
                  Nhãn hiệu <span className="font-medium text-white/40">Altrify</span> đã được Cục Sở hữu trí tuệ Việt Nam cấp bằng bảo hộ. Mọi hành vi sử dụng khi chưa có sự đồng ý của Bee Systems Inc. là vi phạm quyền SHTT.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
