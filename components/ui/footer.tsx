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
                  Chi phí &amp; Gói dịch vụ
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
                  Tầm nhìn &amp; Sứ mệnh
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
                  Dành cho Nhà đầu tư
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
            <div className="text-sm">
              <p className="mb-3 text-indigo-200/65">
                ©aitrify.com
                <span className="text-gray-700"> · </span>
                <a
                  className="text-indigo-200/65 transition hover:text-indigo-500"
                  href="https://www.aitrify.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  2025. BEESOTA6G Technologies Alliance
                </a>
              </p>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
