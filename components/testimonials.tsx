"use client";

import { useState } from "react";
import useMasonry from "@/utils/useMasonry";
import Image, { StaticImageData } from "next/image";
import TestimonialImg01 from "@/public/images/testimonial-01.jpg";
import TestimonialImg02 from "@/public/images/testimonial-02.jpg";
import TestimonialImg03 from "@/public/images/testimonial-03.jpg";
import TestimonialImg04 from "@/public/images/testimonial-04.jpg";
import TestimonialImg05 from "@/public/images/testimonial-05.jpg";
import TestimonialImg06 from "@/public/images/testimonial-06.jpg";

import ClientImg01 from "@/public/images/client-logo-01.svg";
import ClientImg02 from "@/public/images/client-logo-02.svg";
import ClientImg03 from "@/public/images/client-logo-03.svg";
import ClientImg04 from "@/public/images/client-logo-04.svg";
import ClientImg05 from "@/public/images/client-logo-05.svg";
import ClientImg06 from "@/public/images/client-logo-06.svg";


const testimonials = [
  {img:TestimonialImg01,clientImg:ClientImg01,name:"Tư vấn gia dụng",company:"ANNA – AItrify",content:"Bạn cần tư vấn thiết bị điện gia dụng nhưng không biết bắt đầu từ đâu? ANNA hiểu ngữ cảnh sử dụng của bạn, gợi ý đúng sản phẩm phù hợp nhu cầu và ngân sách — không cần bạn phải là chuyên gia kỹ thuật.",categories:[1,2]},
  {img:TestimonialImg01,clientImg:ClientImg01,name:"So sánh & Lựa chọn",company:"ANNA – AItrify",content:"Thị trường thiết bị gia dụng có hàng trăm lựa chọn. ANNA lọ, so sánh và giải thích sự khác biệt giữa các dòng sản phẩm một cách rõ ràng — để bạn mua đúng thứ mình cần, với giá xứng đáng.",categories:[1,2]},
  {img:TestimonialImg02,clientImg:ClientImg02,name:"Golf & Kinh doanh",company:"LISA – AItrify",content:"Dù bạn vừa cầm gậy lần đầu hay đã chơi golf nhiều năm, LISA tư vấn phù hợp với trình độ của bạn — từ thiết bị, kỹ thuật đến văn hóa golf trong môi trường kinh doanh. Golf không chỉ là thể thao — đó là ngôn ngữ kết nối của người thành đạt.",categories:[1,3]},
  {img:TestimonialImg02,clientImg:ClientImg02,name:"Golf thiếu nhi 5–15 tuổi",company:"LISA – AItrify",content:"Golf là môn thể thao lý tưởng để rèn luyện tư duy và tính kiên nhẫn từ nhỏ. LISA hỗ trợ phụ huynh tìm hiểu chương trình học golf cho trẻ em từ 5–15 tuổi, gợi ý dụng cụ phù hợp từng độ tuổi và kết nối với các học viện golf uy tín tại Việt Nam.",categories:[1,3]},
  {img:TestimonialImg03,clientImg:ClientImg04,name:"Xe điện & Trạm sạc",company:"GREEN – AItrify",content:"Thị trường xe điện ngày càng đa dạng — từ xe đạp điện, xe máy điện đến trạm sạc và trạm đổi pin — với nhiều thương hiệu, mức giá và xuất xứ khác nhau. GREEN giúp bạn tìm kiếm, so sánh và lựa chọn phương tiện xanh phù hợp với nhu cầu di chuyển và khả năng tài chính của mình.",categories:[1,4]},
  {img:TestimonialImg03,clientImg:ClientImg04,name:"Lộ trình ESG",company:"GREEN – AItrify",content:"Doanh nghiệp bạn đang cần lộ trình ESG nhưng chưa biết bắt đầu từ đâu? GREEN cung cấp kiến thức, số liệu và hướng dẫn theo tiêu chuẩn quốc tế — để bạn hành động được ngay, không chỉ lập kế hoạch.",categories:[1,4]},
  {img:TestimonialImg04,clientImg:ClientImg03,name:"Tra cứu pháp luật",company:"LEGA – AItrify",content:"Pháp luật ban hành thành nhiều văn bản và liên tục được cập nhật, không phải ai cũng có luật sư riêng. LEGA tra cứu, trích dẫn và giải thích văn bản pháp lý bằng ngôn ngữ dễ hiểu — giúp bạn hiểu đúng quyền và nghĩa vụ của mình.",categories:[1,5]},
  {img:TestimonialImg04,clientImg:ClientImg03,name:"Thủ tục & Kinh doanh",company:"LEGA – AItrify",content:"Từ thủ tục hành chính đến câu hỏi pháp lý trong kinh doanh, LEGA tìm kiếm có căn cứ, có trích dẫn điều khoản cụ thể — không suy diễn, không mơ hồ, hỗ trợ người dùng có đủ thông tin để tuân thủ đúng pháp luật.",categories:[1,5]},
  {img:TestimonialImg05,clientImg:ClientImg05,name:"Viễn thông MNO/MVNO",company:"MOBI – AItrify",content:"Truyền số liệu — đặc biệt truyền số liệu tầm xa — đang phát triển với nhiều phương thức mới. MOBI giúp kỹ sư, chuyên gia và phụ trách sản phẩm của các nhà mạng MNO/MVNO cập nhật thông tin nhanh chóng và tra cứu kiến thức viễn thông dễ dàng.",categories:[1,6]},
  {img:TestimonialImg05,clientImg:ClientImg05,name:"IoT & Hạ tầng số",company:"MOBI – AItrify",content:"Bee Systems đang đầu tư vào nghiên cứu phát triển các công nghệ cao cho hạ tầng viễn thông thế hệ mới. MOBI giúp tìm các thông tin về thiết bị IoT, công nghệ truyền số liệu IoT, với mức chi phí phù hợp, các giải pháp IoT tổng thể và các nhà cung cấp IoT.",categories:[1,6]},
  {img:TestimonialImg06,clientImg:ClientImg06,name:"Tài chính thị trường",company:"AIFI – AItrify",content:"Thị trường tài chính không ngủ — tỉ giá, vàng, dầu, chứng khoán biến động từng giờ. AIFI tổng hợp và phân tích thông tin tài chính đa chiều để hỗ trợ bạn ra quyết định nhanh hơn, sáng suốt hơn.",categories:[1,7]},
  {img:TestimonialImg06,clientImg:ClientImg06,name:"Tài sản mã hóa",company:"AIFI – AItrify",content:"Tài sản số đang định hình lại nền kinh tế toàn cầu. AIFI theo dõi xu hướng tài sản mã hóa từ các nguồn chính thống và đặc biệt cập nhật tình hình tài sản mã hóa tại Việt Nam — từ chính sách vĩ mô, nhà cung cấp được cấp phép đến cách thức chuẩn bị đăng ký giao dịch — giúp bạn tiên phong trong kỷ nguyên Tài sản Số.",categories:[1,7]},
];

export default function Testimonials() {
  const masonryContainer = useMasonry();
  const [category, setCategory] = useState<number>(1);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="border-t py-12 [border-image:linear-gradient(to_right,transparent,--theme(--color-slate-400/.25),transparent)1] md:py-20">
        {/* Section header */}
        <div className="mx-auto max-w-3xl pb-12 text-center">
          <h2 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
       6 AI Agent, 6 lĩnh vực — luôn có chuyên gia cho bạn
          </h2>
          <p className="text-lg text-indigo-200/65">
            Mỗi AI Agent trả lời dựa trên dữ liệu chính thống, có trích dẫn nguyên văn. Chọn lĩnh vực bạn cần — tư vấn bắt đầu ngay, miễn phí.
          </p>
        </div>

        <div>
          {/* Buttons */}
          <div className="flex justify-center pb-12 max-md:hidden md:pb-16">
            <div className="relative inline-flex flex-wrap justify-center rounded-[1.25rem] bg-gray-800/40 p-1">
              {/* Button #1 */}
              <button
                className={`flex h-8 flex-1 items-center gap-2.5 whitespace-nowrap rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-indigo-200 ${category === 1 ? "relative bg-linear-to-b from-gray-900 via-gray-800/60 to-gray-900 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_bottom,--theme(--color-indigo-500/0),--theme(--color-indigo-500/.5))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]" : "opacity-65 transition-opacity hover:opacity-90"}`}
                aria-pressed={category === 1}
                onClick={() => setCategory(1)}
              >
                <svg
                  className={`fill-current ${category === 1 ? "text-indigo-500" : "text-gray-600"}`}
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height={16}
                >
                  <path d="M.062 10.003a1 1 0 0 1 1.947.455c-.019.08.01.152.078.19l5.83 3.333c.052.03.115.03.168 0l5.83-3.333a.163.163 0 0 0 .078-.188 1 1 0 0 1 1.947-.459 2.161 2.161 0 0 1-1.032 2.384l-5.83 3.331a2.168 2.168 0 0 1-2.154 0l-5.83-3.331a2.162 2.162 0 0 1-1.032-2.382Zm7.854-7.981-5.83 3.332a.17.17 0 0 0 0 .295l5.828 3.33c.054.031.118.031.17.002l5.83-3.333a.17.17 0 0 0 0-.294L8.085 2.023a.172.172 0 0 0-.17-.001ZM9.076.285l5.83 3.332c1.458.833 1.458 2.935 0 3.768l-5.83 3.333c-.667.38-1.485.38-2.153-.001l-5.83-3.332c-1.457-.833-1.457-2.935 0-3.767L6.925.285a2.173 2.173 0 0 1 2.15 0Z" />
                </svg>
                <span>Tất cả</span>
              </button>
              {/* Button #2 */}
              <button
                className={`flex h-8 flex-1 items-center gap-2.5 whitespace-nowrap rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-indigo-200 ${category === 2 ? "relative bg-linear-to-b from-gray-900 via-gray-800/60 to-gray-900 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_bottom,--theme(--color-indigo-500/0),--theme(--color-indigo-500/.5))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]" : "opacity-65 transition-opacity hover:opacity-90"}`}
                aria-pressed={category === 2}
                onClick={() => setCategory(2)}
              >
                <svg
                  className={`fill-current ${category === 2 ? "text-indigo-500" : "text-gray-600"}`}
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height={16}
                >
                  <path d="M6.5 3.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM9 6.855A3.502 3.502 0 0 0 8 0a3.5 3.5 0 0 0-1 6.855v1.656L5.534 9.65a3.5 3.5 0 1 0 1.229 1.578L8 10.267l1.238.962a3.5 3.5 0 1 0 1.229-1.578L9 8.511V6.855Zm2.303 4.74c.005-.005.01-.01.013-.016l.012-.016a1.5 1.5 0 1 1-.025.032ZM3.5 11A1.497 1.497 0 0 1 5 12.5 1.5 1.5 0 1 1 3.5 11Z" />
                </svg>
                <span>ANNA</span>
              </button>
              {/* Button #3 */}
              <button
                className={`flex h-8 flex-1 items-center gap-2.5 whitespace-nowrap rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-indigo-200 ${category === 3 ? "relative bg-linear-to-b from-gray-900 via-gray-800/60 to-gray-900 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_bottom,--theme(--color-indigo-500/0),--theme(--color-indigo-500/.5))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]" : "opacity-65 transition-opacity hover:opacity-90"}`}
                aria-pressed={category === 3}
                onClick={() => setCategory(3)}
              >
                <svg
                  className={`fill-current ${category === 3 ? "text-indigo-500" : "text-gray-600"}`}
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height={16}
                >
                  <path d="M2.428 10c.665-1.815 1.98-3.604 3.44-4.802-.6-1.807-1.443-3.079-2.29-3.18-1.91-.227-2.246 2.04-.174 2.962a1 1 0 1 1-.813 1.827C-1.407 5.028-.589-.491 3.815.032c1.605.191 2.925 1.811 3.79 4.07.979-.427 1.937-.51 2.735-.092.818.429 1.143 1.123 1.294 2.148.015.1.022.149.043.32.542-.537 1.003-.797 1.693-.622.64.162.894.493 1.195 1.147l.018.04a1 1 0 0 1 1.133 1.61c-.46.47-1.12.574-1.744.398a1.661 1.661 0 0 1-.87-.592 2.127 2.127 0 0 1-.224-.349 3.225 3.225 0 0 1-.55.477c-.377.253-.8.368-1.259.267-.993-.218-1.21-.779-1.367-2.05-.027-.22-.033-.262-.046-.353-.067-.452-.144-.617-.244-.67-.225-.118-.665-.013-1.206.278.297 1.243.475 2.587.516 3.941H15a1 1 0 0 1 0 2H8.68l-.025.285c-.173 1.918-.906 3.381-2.654 3.668-1.5.246-3.013-.47-3.677-1.858-.29-.637-.39-1.35-.342-2.095H1a1 1 0 0 1 0-2h1.428Zm2.11 0h2.175a18.602 18.602 0 0 0-.284-2.577c-.205.202-.408.42-.606.654A9.596 9.596 0 0 0 4.537 10Zm2.135 2H3.942c-.032.465.03.888.194 1.25.258.538.89.836 1.54.73.546-.09.888-.772.988-1.875L6.673 12Z" />
                </svg>
                <span>LISA</span>
              </button>
              {/* Button #4 */}
              <button
                className={`flex h-8 flex-1 items-center gap-2.5 whitespace-nowrap rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-indigo-200 ${category === 4 ? "relative bg-linear-to-b from-gray-900 via-gray-800/60 to-gray-900 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_bottom,--theme(--color-indigo-500/0),--theme(--color-indigo-500/.5))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]" : "opacity-65 transition-opacity hover:opacity-90"}`}
                aria-pressed={category === 4}
                onClick={() => setCategory(4)}
              >
                <svg
                  className={`fill-current ${category === 4 ? "text-indigo-500" : "text-gray-600"}`}
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height={16}
                >
                  <path d="M3.757 3.758a6 6 0 0 1 8.485 8.485 5.992 5.992 0 0 1-5.301 1.664 1 1 0 1 0-.351 1.969 8 8 0 1 0-4.247-2.218 1 1 0 0 0 1.415-.001L9.12 8.294v1.827a1 1 0 1 0 2 0v-4.2a.997.997 0 0 0-1-1.042H5.879a1 1 0 1 0 0 2h1.829l-4.599 4.598a6 6 0 0 1 .648-7.719Z" />
                </svg>
                <span>GREEN</span>
              </button>
              {/* Button #5 */}
              <button
                className={`flex h-8 flex-1 items-center gap-2.5 whitespace-nowrap rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-indigo-200 ${
                  category === 5
                    ? "relative bg-linear-to-b from-gray-900 via-gray-800/60 to-gray-900 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_bottom,--theme(--color-indigo-500/0),--theme(--color-indigo-500/.5))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]"
                    : "opacity-65 transition-opacity hover:opacity-90"
                }`}
                aria-pressed={category === 5}
                onClick={() => setCategory(5)}
              >
                <svg
                  className={`fill-current ${
                    category === 5 ? "text-indigo-500" : "text-gray-600"
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height={16}
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 14.93V19h-2v-2.07A8.001 8.001 0 014.07 13H2v-2h2.07A8.001 8.001 0 0111 4.07V2h2v2.07A8.001 8.001 0 0119.93 11H22v2h-2.07A8.001 8.001 0 0113 16.93z" />
                </svg>
                <span>LEGA</span>
              </button>
              {/* Button #6 - MOBI */}
              <button
                className={`flex h-8 flex-1 items-center gap-2.5 whitespace-nowrap rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-indigo-200 ${category === 6 ? "relative bg-linear-to-b from-gray-900 via-gray-800/60 to-gray-900 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_bottom,--theme(--color-indigo-500/0),--theme(--color-indigo-500/.5))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]" : "opacity-65 transition-opacity hover:opacity-90"}`}
                aria-pressed={category === 6}
                onClick={() => setCategory(6)}
              >
                <svg className={`fill-current ${category === 6 ? "text-indigo-500" : "text-gray-600"}`} xmlns="http://www.w3.org/2000/svg" width="16" height={16} viewBox="0 0 24 24"><path d="M17 2H7C5.9 2 5 2.9 5 4v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 18c-.83 0-1.5-.67-1.5-1.5S11.17 17 12 17s1.5.67 1.5 1.5S12.83 20 12 20zm5-4H7V4h10v12z"/></svg>
                <span>MOBI</span>
              </button>
              {/* Button #7 - AIFI */}
              <button
                className={`flex h-8 flex-1 items-center gap-2.5 whitespace-nowrap rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-indigo-200 ${category === 7 ? "relative bg-linear-to-b from-gray-900 via-gray-800/60 to-gray-900 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_bottom,--theme(--color-indigo-500/0),--theme(--color-indigo-500/.5))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]" : "opacity-65 transition-opacity hover:opacity-90"}`}
                aria-pressed={category === 7}
                onClick={() => setCategory(7)}
              >
                <svg className={`fill-current ${category === 7 ? "text-indigo-500" : "text-gray-600"}`} xmlns="http://www.w3.org/2000/svg" width="16" height={16} viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
                <span>AIFI</span>
              </button>
            </div>
          </div>

          {/* Cards */}
          <div
            className="mx-auto grid max-w-sm items-start gap-6 sm:max-w-none sm:grid-cols-2 lg:grid-cols-3"
            ref={masonryContainer}
          >
            {testimonials.map((testimonial, index) => (
              <div key={index} className="group">
                <Testimonial testimonial={testimonial} category={category}>
                  {testimonial.content}
                </Testimonial>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Testimonial({
  testimonial,
  category,
  children,
}: {
  testimonial: {
    img: StaticImageData;
    clientImg: StaticImageData;
    name: string;
    company: string;
    content: string;
    categories: number[];
  };
  category: number;
  children: React.ReactNode;
}) {
  return (
    <article
      className={`relative rounded-2xl bg-linear-to-br from-gray-900/50 via-gray-800/25 to-gray-900/50 p-5 backdrop-blur-xs transition-opacity before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] ${!testimonial.categories.includes(category) ? "opacity-30" : ""}`}
    >
      <div className="flex flex-col gap-4">
        <div>
          <Image src={testimonial.clientImg} height={36} alt="Client logo" />
        </div>
        <p className="text-indigo-200/65 before:content-['“'] after:content-['”']">
          {children}
        </p>
        <div className="flex items-center gap-3">
          <Image
            className="inline-flex shrink-0 rounded-full"
            src={testimonial.img}
            width={36}
            height={36}
            alt={testimonial.name}
          />
          <div className="text-sm font-medium text-gray-200">
            <span>{testimonial.name}</span>
            <span className="text-gray-700"> - </span>
            <a
              className="text-indigo-200/65 transition-colors hover:text-indigo-500"
              href="#0"
            >
              {testimonial.company}
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
