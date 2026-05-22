'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface ChatboxProps {
  agent: string;
}

// const API_URL = 'https://ai.aitrify.com/ask';
const API_URL = 'https://aitrify-api-921228610982.asia-southeast1.run.app/ask';
const USER_LOGIN = 'mock_user';

const AGENT_CONFIGS: Record<string, { name: string; greeting: string; color: string }> = {
  anna: {
    name: 'ANNA',
    greeting:
      'ANNA ở đây để giúp bạn tìm được tiện nghi như điều hòa và thiết bị gia dụng chính hãng kèm dịch vụ chuẩn hãng nhưng giá luôn trong Top Ưu đãi nhất!',
    color: 'bg-red-50 border-red-300', // đổi sang đỏ nhạt cho đồng bộ nút
  },
  lisa: {
    name: 'LISA',
    greeting:
      'Chào Ông/Bà, LISA rất hân hạnh được trợ giúp về bộ môn Golf, hơn cả một môn thể thao sang trọng, Golf là Đẳng cấp về sự kết nối của những người Thành đạt!',
    color: 'bg-blue-50 border-blue-300',
  },
  ugreen: {
    name: 'GREEN',
    greeting:
      'Chào anh/chị, GREEN là trợ lý về kiến thức năng lượng xanh, xe điện và công nghệ giảm phát thải CO2. GREEN hỗ trợ tìm kiếm xe đạp điện, xe máy điện, trạm sạc và trạm đổi pin, cùng các giải pháp chuyển đổi xanh phù hợp nhu cầu và ngân sách của bạn.',
    color: 'bg-green-50 border-green-300', // màu xanh cũ của ANNA
  },
};


// --- Footer static topics (dùng chung cho ANNA & LISA) ---
const FOOTER_TOPICS: Record<string, { title: string; content: string }> = {
  'features': {
    title: 'Tính năng',
    content:
      '• 6 AI Agent chuyên biệt: ANNA (gia dụng), LISA (golf), GREEN (năng lượng xanh), LEGA (pháp lý), MOBI (viễn thông), AIFI (tài chính) — mỗi Agent được đào tạo từ dữ liệu chính thống, có trích dẫn nguyên văn.\n' +
      '• Hỏi đáp tiếng Việt tự nhiên, hiểu ngữ cảnh và nhu cầu thực tế của người dùng.\n' +
      '• Cập nhật tri thức liên tục từ các nguồn chính thống, ghi rõ thời điểm cập nhật.'
  },
    'integrations': {
    title: 'Tích hợp',
    content:
      '• Kết nối hệ thống ERP, IoT, Blockchain và hạ tầng Cloud Native (GCP, GCR, GCS).\n' +
      '• Tích hợp nguồn dữ liệu có kiểm chứng từ các tổ chức uy tín, có xác thực và dẫn chiếu.\n' +
      '• Bộ SDK & API mở dần theo lộ trình cho doanh nghiệp muốn nhúng AI Agent vào hệ thống riêng.\n' +
      '• Roadmap: kết nối cổng thanh toán, xuất hóa đơn điện tử, đồng bộ CRM/ERP đối tác.'
  },
    'pricing': {
    title: 'Chi phí & Gói dịch vụ',
    content:
      'Xem báo giá đầy đủ 4 mô hình dịch vụ của Bee Systems tại:\n\n' +
      '🔗 www.beeinc.vn/#pricing\n\n' +
      'Bao gồm: Cloud Native Infrastructure, AI Agent & Chatbot, Phần cứng IoT/IIoT, Tích hợp toàn diện D&B.\n\n' +
      'Liên hệ tư vấn: chairm@beeinc.vn'
  },
    'brands': {
    title: 'Hãng sản xuất',
    content:
      '• AItrify ANNA/LISA/GREEN chỉ hợp tác với các hãng cung cấp hàng CHÍNH HÃNG, có nguồn gốc xuất xứ và hóa đơn hợp lệ theo quy định pháp luật Việt Nam.\n' +
      '• Hãng gia dụng, golf, xe điện hoặc đối tác muốn hợp tác với AItrify ANNA/LISA/GREEN vui lòng liên hệ: chairm@beeinc.vn — đội ngũ sẽ phản hồi sớm nhất.'
  },
    'policies': {
    title: 'Chính sách',
    content:
      '• Đổi trả và bảo hành theo chính sách từng hãng và từng thời điểm áp dụng.\n' +
      '• Vận chuyển và khuyến mại có thể thay đổi theo từng chiến dịch cụ thể.\n' +
      '• Xem thêm: Thỏa thuận người dùng (EUA), Điều khoản dịch vụ, Chính sách bảo mật.'
  },
    'about': {
    title: 'Về AItrify',
    content:
      'AItrify là nền tảng AI đa tác tử (Multi-Agent AI Platform) do Bee Systems Inc. phát triển — đưa Trí tuệ nhân tạo vào từng lĩnh vực chuyên sâu của đời sống và kinh doanh.\n\n' +
      'AItrify hiện triển khai 6 AI Agent chuyên biệt: ANNA (điện gia dụng), LISA (Golf & Golfer), GREEN (năng lượng xanh), LEGA (pháp lý), MOBI (viễn thông & IoT), AIFI (tài chính & tài sản số) — mỗi Agent được đào tạo từ dữ liệu chính thống, có trích dẫn nguyên văn và cập nhật liên tục.\n\n' +
      'Phát triển bởi Bee Systems Inc. — www.beeinc.vn'
  },
  'vision': {
    title: 'Tầm nhìn & Sứ mệnh',
    content:
      'Tầm nhìn: AItrify hướng tới đưa AI Agent trở thành cố vấn chuyên gia riêng cho mọi cá nhân và doanh nghiệp — hoạt động 24/7, chi phí siêu thấp, không giới hạn lĩnh vực.\n\n' +
      'Sứ mệnh: Dân chủ hóa tri thức chuyên sâu — để mọi người đều được tiếp cận thông tin chính xác, có căn cứ và cập nhật liên tục từ các nguồn chính thống, bất kể thu nhập hay vị trí địa lý.'
  },
  'technology': {
    title: 'Công nghệ AItrify',
    content:
      'AItrify được xây dựng trên nền tảng công nghệ hiện đại, triển khai toàn bộ trên hạ tầng Cloud Native:\n\n' +
      '• AI & LLM: Các mô hình ngôn ngữ lớn (LLM), mô hình xử lý ảnh Image-to-Text, OCR, Text-to-Speech và các mô hình chuyên biệt theo từng lĩnh vực\n' +
      '• RAG (Retrieval-Augmented Generation): Truy vấn tri thức chuyên sâu theo từng AI Agent với độ chính xác cao\n' +
      '• Cloud Native: GCP, GCR, GCS và hạ tầng Edge Computing phủ toàn cầu\n' +
      '• Database chuyên biệt: VectorizeDB (dữ liệu AI), D1 (relational), R2 (object storage)\n' +
      '• Uptime 99.97% — dịch vụ liên tục 24/7\n\n' +
      'Phát triển bởi Bee Systems Inc. — www.beeinc.vn'
  },
  'careers': {
    title: 'Tuyển dụng',
    content:
      'Bee Systems Inc. đang tìm kiếm đồng đội tài năng và đam mê công nghệ:\n\n' +
      '• Kỹ sư AI/ML, Backend, Frontend\n' +
      '• Chuyên gia viễn thông, IoT, Blockchain\n' +
      '• Business Development & Partnership\n' +
      '• Phân tích dữ liệu và nội dung chuyên sâu\n\n' +
      'Không quan trọng bằng cấp — quan trọng là đam mê, năng lực thực chiến và tư duy sản phẩm.\n\n' +
      'Gửi CV tới: chairm@beeinc.vn'
  },
  'investors': {
    title: 'Dành cho Nhà đầu tư',
    content:
      'Bee Systems Inc. đang phát triển hệ sinh thái công nghệ gồm:\n\n' +
      '• AItrify: Nền tảng AI đa tác tử cho doanh nghiệp và người dùng\n' +
      '• Hạ tầng viễn thông thế hệ mới: 5G, IoT, Smart Grid\n' +
      '• Blockchain & tài sản số: DLT, ERC-20, chia sẻ năng lượng P2P\n\n' +
      'Chúng tôi chào đón các nhà đầu tư có tầm nhìn dài hạn trong lĩnh vực AI, viễn thông và công nghệ xanh.\n\n' +
      'Liên hệ quan hệ nhà đầu tư: chairm@beeinc.vn'
  },
  'partners': {
    title: 'Dành cho Hãng/Đối tác',
    content:
      'AItrify chào đón các hãng và đối tác muốn đưa sản phẩm/dịch vụ đến người dùng qua nền tảng AI:\\n\\n' +
      '• Hàng hóa CHÍNH HÃNG, có đầy đủ nguồn gốc xuất xứ và hóa đơn hợp lệ theo pháp luật Việt Nam\\n' +
      '• Cam kết dịch vụ hậu mãi tận tâm cho người dùng cuối\\n' +
      '• Phù hợp với các lĩnh vực: gia dụng, golf, xe điện, pháp lý, viễn thông, tài chính\\n\\n' +
      'Gửi đề xuất hợp tác tới: chairm@beeinc.vn — đội ngũ sẽ phản hồi sớm nhất.'
  },
  'eua': {
    title: 'Thoả thuận người dùng (EUA)',
    content:
      '• Sử dụng AItrify đồng nghĩa với việc tuân thủ pháp luật Việt Nam và chấp nhận toàn bộ điều khoản của Bee Systems Inc.\n' +
      '• Thông tin từ các AI Agent chỉ mang tính tham khảo, không thay thế tư vấn pháp lý, y tế hay tài chính chuyên nghiệp.\n' +
      '• Dữ liệu người dùng được bảo mật theo Chính sách bảo mật của Bee Systems Inc.\n' +
      '• Bee Systems Inc. bảo lưu quyền điều chỉnh, tạm ngưng hoặc cập nhật dịch vụ và sẽ thông báo đến người dùng.'
  },
  'terms': {
    title: 'Điều khoản dịch vụ',
    content:
      '• AItrify cung cấp thông tin tham khảo từ các nguồn chính thống, có trích dẫn và cập nhật liên tục.\n' +
      '• Giá cả, ưu đãi và chính sách có thể thay đổi theo từng thời điểm — AItrify sẽ thể hiện rõ trong kết quả tư vấn.\n' +
      '• Bee Systems Inc. bảo lưu quyền điều chỉnh hoặc tạm ngưng dịch vụ khi cần thiết.\n' +
      '• Liên hệ: chairm@beeinc.vn để được hỗ trợ về điều khoản dịch vụ.'
  },
  'privacy': {
    title: 'Chính sách bảo mật',
    content:
      '• AItrify cam kết bảo vệ thông tin cá nhân theo quy định pháp luật Việt Nam về bảo vệ dữ liệu cá nhân.\n' +
      '• Dữ liệu chỉ được sử dụng để cải thiện trải nghiệm dịch vụ, không chia sẻ cho bên thứ ba ngoài mục đích cung cấp dịch vụ.\n' +
      '• Người dùng có quyền yêu cầu xem, chỉnh sửa hoặc xóa dữ liệu cá nhân bất kỳ lúc nào.\n' +
      '• Liên hệ: chairm@beeinc.vn để thực hiện các quyền về dữ liệu cá nhân.'
  },
  'guide/getting-started': {
    title: 'Sử dụng AItrify',
    content:
      'Bắt đầu sử dụng AItrify:\n\n' +
      '1. Truy cập www.aitrify.com\n' +
      '2. Chọn AI Agent phù hợp: ANNA (gia dụng), LISA (golf), GREEN (xe điện), LEGA (pháp lý), MOBI (viễn thông), AIFI (tài chính)\n' +
      '3. Gõ câu hỏi tự nhiên và nhấn Gửi\n\n' +
      'AItrify hoàn toàn miễn phí — không cần đăng ký tài khoản.'
  },
  'guide/signup': {
    title: 'Đăng ký AItrify',
    content:
      'Hiện tại, AItrify chuẩn bị bước đấu áp dụng đăng ký qua email. Khi có tính năng này bạn chỉ cần Nhấn nút Đăng ký và điền thông tin, nếu là người dùng tổ chức có thể nhập thêm thông tin công ty. ' + 
      'Người dùng đăng ký có thêm quyền hỏi nhiều câu hỏi hơn so với người dùng không đăng ký, nhận được thông tin chi tiết hơn và các ưu đãi khác tùy theo chính sách từng thời điểm. ' + 
      'AItrify cũng cho phép đăng ký bằng tài khoản Gmail qua nút "Đăng ký với Gmail" trong quá trình đăng ký.'
  },
  'guide/purchase': {
    title: 'Báo giá & Liên hệ',
    content:
      'Xem báo giá đầy đủ các dịch vụ và giải pháp công nghệ của Bee Systems tại:\n\n' +
      'www.beeinc.vn/#pricing\n\n' +
      'Để được tư vấn hoặc gửi yêu cầu hợp tác, liên hệ qua email:\n\n' +
      'chairm@beeinc.vn\n\n' +
      'Đội ngũ Bee Systems sẽ phản hồi sớm nhất có thể.'
  },
  'guide/search': {
    title: 'Tìm kiếm với AItrify',
    content:
      'Bạn quan tâm tới hàng hóa, sản phẩm, dịch vụ gì, chỉ cần đặt từ khóa trong câu hỏi gửi tới ANNA hoặc LISA, các trợ lý sẽ giúp bạn tìm nhanh và chính xác hơn.'
  },
  'guide/partner': {
    title: 'Hợp tác với AItrify',
    content:
      'Quý Đối tác hãy gửi mail tới: chairm@beeinc.vn để hội đồng quản lý đối tác của AItrify nghiên cứu chi tiết và phản hồi sớm nhất. ' + 
      'Thông tin gửi tới có thể là đề xuất hợp tác cụ thể, hoặc hàng hóa chính hãng với đầy đủ nguồn gốc xuất xứ mà bạn muốn cung cấp trên AItrify.'
  },
  'disclaimer': {
    title: 'Tuyên bố miễn trừ',
    content:
      'Thông tin từ các AI Agent dựa trên dữ liệu được đào tạo và có thể chưa phản ánh đầy đủ các thay đổi mới nhất.\n\n' +
      'AItrify và Bee Systems Inc. không chịu trách nhiệm cho các quyết định được đưa ra dựa trên thông tin tham khảo từ hệ thống.\n\n' +
      'Bee Systems Inc. được miễn trừ trách nhiệm trong các trường hợp bất khả kháng như sự cố kỹ thuật ngoài tầm kiểm soát.\n\n' +
      'Để xác nhận thông tin chính xác nhất, vui lòng liên hệ: chairm@beeinc.vn'
  },
};


export default function Chatbox({ agent }: ChatboxProps) {
  const config = AGENT_CONFIGS[agent] || AGENT_CONFIGS['anna'];
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [chatHistories, setChatHistories] = useState<Record<string, { sender: string; text: string }[]>>({
    anna: [{ sender: 'ai', text: AGENT_CONFIGS.anna.greeting }],
    lisa: [{ sender: 'ai', text: AGENT_CONFIGS.lisa.greeting }],
    ugreen: [{ sender: 'ai', text: AGENT_CONFIGS.ugreen.greeting }],
  });


  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isAbortedRef = useRef(false);

  const [chatboxExpanded, setChatboxExpanded] = useState(false);

  // Load trạng thái maximize từ localStorage khi khởi tạo
  useEffect(() => {
    const savedExpandState = localStorage.getItem('aitrify_chatbox_expanded');
    if (savedExpandState === 'true') {
      setChatboxExpanded(true);
    }
  }, []);

  const handleToggleExpand = () => {
    const newState = !chatboxExpanded;
    setChatboxExpanded(newState);
    localStorage.setItem('aitrify_chatbox_expanded', newState.toString());
  };

  const messages = chatHistories[agent] || [];

  // Footer 
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading, agent]);

  // Lắng nghe sự kiện từ Footer
useEffect(() => {
  const onFooter = (e: Event) => {
    const detail = (e as CustomEvent).detail || {};
    const topicKey = (detail.topic || '').toString();
    if (!topicKey || !FOOTER_TOPICS[topicKey]) return;

    // 1) cuộn lên đầu & focus vùng chat
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      chatContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);

    // 2) trả lời ngay trong ô chat của agent hiện tại
    answerFooterTopic(topicKey);
  };

  window.addEventListener('aitrify:footer', onFooter as EventListener);
  return () => window.removeEventListener('aitrify:footer', onFooter as EventListener);
}, [agent]);

  
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };

    // Cập nhật lịch sử chat cho agent hiện tại
    setChatHistories((prev) => ({
      ...prev,
      [agent]: [...(prev[agent] || []), userMessage],
    }));

    setInput('');
    setLoading(true);

    isAbortedRef.current = false;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    await mockChatAPI(input, controller.signal);

    abortControllerRef.current = null;
    setLoading(false);
  };

  const abortChat = () => {
    if (abortControllerRef.current) {
      isAbortedRef.current = true;
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setChatHistories((prev) => ({
      ...prev,
      [agent]: [...(prev[agent] || []), { sender: 'ai', text: '(Đã dừng trả lời)' }],
    }));
    setLoading(false);
  };


  // ⌨️ typewriterRevealPrefix: mỗi tick SET PREFIX, không nối chuỗi
  const typewriterRevealPrefix = async (fullText: string, messageId: string, agentName: string) => {
    console.count('typewriterRevealPrefix called');

    return new Promise<void>((resolve) => {
      const chars = Array.from(fullText);
      const total = chars.length;

      // Seed prefix 1 ký tự ngay lập tức
      setChatHistories(prev => {
        const list = prev[agentName] || [];
        const idx = list.findIndex(m => (m as any).id === messageId);
        if (idx === -1) return prev;
        const next = [...list];
        next[idx] = { ...next[idx], text: chars.slice(0, 1).join('') };
        return { ...prev, [agentName]: next };
      });

      let i = 1; // sẽ hiển thị prefix [0..i]
      const timer = setInterval(() => {
        if (isAbortedRef.current) {
          clearInterval(timer);
          resolve();
          return;
        }
        setChatHistories(prev => {
          const list = prev[agentName] || [];
          const idx = list.findIndex(m => (m as any).id === messageId);
          if (idx === -1) return prev;

          const next = [...list];
          // Hiển thị chính xác prefix, tránh rơi/mất ký tự dù có race
          next[idx] = { ...next[idx], text: chars.slice(0, i + 1).join('') };
          return { ...prev, [agentName]: next };
        });

        i++;
        if (i >= total) {
          clearInterval(timer);
          resolve();
        }
      }, 20);
    });
  };

  function linkify(text: string) {
    // Escape HTML cơ bản
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // URL: http(s)://... hoặc www...
    const urlRegex = /(?:https?:\/\/|www\.)[^\s<]+/gi;
    html = html.replace(urlRegex, (raw) => {
      const href = raw.startsWith('www.') ? `https://${raw}` : raw;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 underline">${raw}</a>`;
    });

    // Email
    const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
    html = html.replace(
      emailRegex,
      (addr) =>
        `<a href="mailto:${addr}" class="text-indigo-600 underline">${addr}</a>`
    );

    // Hotline (chữ “hotline”, không phân biệt hoa thường)
    const hotlineRegex = /\bhotline\b/gi;
    html = html.replace(
      hotlineRegex,
      (match) => `<strong class="text-red-600">${match}</strong>`
    );

    // Số điện thoại VN cơ bản (10–11 số)
    const phoneRegex = /\b\d{9,11}\b/g;
    html = html.replace(
      phoneRegex,
      (num) =>
        `<a href="tel:${num}" class="font-bold text-red-600 underline">${num}</a>`
    );

    return html;
  }



  const mockChatAPI = async (userInput: string, signal?: AbortSignal) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userInput, user_login: USER_LOGIN, agent }),
        signal,
      });
      if (!response.ok) throw new Error('Không thể kết nối tới máy chủ AI.');

      const rawText = await response.text();
      console.log('Raw Response from BE:', rawText);

      const data = JSON.parse(rawText);
      const answer: string = (data?.answer ?? '').toString();
      console.log('Parsed Answer:', answer);

      const chars = Array.from(answer);
      const firstChar = chars[0] ?? '';
      const displayText = chars.slice(1).join('');
      const fullAnswer = firstChar + displayText;

      console.log('First Char:', firstChar);
      console.log('Display Text (thiếu đầu):', displayText);
      console.log('Full Answer:', fullAnswer);

      // Tạo message mới, KHÔNG đụng các message AI trước đó
      const messageId = `ai-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setChatHistories(prev => {
        const list = prev[agent] || [];
        return { ...prev, [agent]: [...list, { id: messageId, sender: 'ai', text: '' }] };
      });

      if (fullAnswer) {
        await typewriterRevealPrefix(fullAnswer, messageId, agent); // await để không chồng chéo
      }
      return fullAnswer || 'AItrify: Không có nội dung trả về.';
    } catch (err) {
      if ((err as Error).name === 'AbortError') return '';
      console.error('Error in mockChatAPI:', (err as Error).message);
      return '❌ Lỗi kết nối server: ' + (err as Error).message;
    }
  };

  // Footer gõ theo "từng từ" để an toàn Unicode
const typeWords = async (full: string) => {
  const words = full.split(/(\s+)/); // giữ cả khoảng trắng
  for (const w of words) {
    await new Promise((r) => {
      setTimeout(() => {
        setChatHistories((prev) => {
          const cur = prev[agent] || [];
          const last = cur[cur.length - 1];
          if (!last || last.sender !== 'ai') return prev;
          const updated = { ...last, text: last.text + w };
          return { ...prev, [agent]: [...cur.slice(0, -1), updated] };
        });
        r(null);
      }, w.trim() ? 22 : 10);
    });
  }
};

const answerFooterTopic = async (topicKey: string) => {
  const { title, content } = FOOTER_TOPICS[topicKey];
  // đẩy như 1 “câu hỏi” hệ thống
  setChatHistories((prev) => ({
    ...prev,
    [agent]: [...(prev[agent] || []), { sender: 'user', text: title }],
  }));

  // tạo bubble AI rỗng rồi gõ dần
  setTimeout(() => {
    setChatHistories((prev) => ({
      ...prev,
      [agent]: [...(prev[agent] || []), { sender: 'ai', text: '' }],
    }));
    typeWords(content);
  }, 50);
};

  return (
    <div
      className={`relative w-full ${chatboxExpanded ? 'max-w-full' : 'max-w-3xl'} mx-auto rounded-xl border ${config.color} backdrop-blur shadow-lg p-4 flex flex-col gap-4 transition-all duration-300`}
    >
      {/* ✅ NÚT MAXIMIZE / MINIMIZE */}
      <button
        onClick={handleToggleExpand}
        className="absolute top-3 right-3 p-1 rounded-full bg-white/80 hover:bg-white/90 shadow-lg border border-gray-300 text-gray-700"
        title={chatboxExpanded ? 'Thu nhỏ khung chat' : 'Phóng to khung chat'}
      >
        <span className="text-lg font-bold">
          {chatboxExpanded ? '−' : '+'}
        </span>
      </button>

      {/* ✅ PHẦN CHAT */}
      <div
        ref={chatContainerRef}
        className={`overflow-y-auto space-y-2 mb-2 ${chatboxExpanded ? 'max-h-[70vh]' : 'max-h-72'}`}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`rounded-lg px-3 py-2 max-w-[75%] text-sm sm:text-base whitespace-pre-wrap break-words ${
              msg.sender === 'user'
                ? 'bg-indigo-100 self-end ml-auto text-right'
                : 'self-start flex items-center gap-2 ' +
                  (agent === 'lisa' ? 'bg-blue-50' : 'bg-green-50')
            }`}
            style={{ wordBreak: 'break-word' }} // Đảm bảo từ dài (như số) không bị cắt
          >
            {msg.sender === 'ai' && (
              <Image
                src="/images/ai-logo-icon.png"
                alt="AItrify Logo"
                width={40}
                height={40}
                className="mr-2 rounded-full"
              />
            )}
            <span
              className="text-gray-900"
              dangerouslySetInnerHTML={{ __html: linkify(msg.text).replace(/\n/g, "<br>") }}
            />
          </div>
        ))}

        {loading && (
          <div
            className={`self-start flex items-center gap-2 px-3 py-2 rounded-lg max-w-[60%] ${
              agent === 'lisa' ? 'bg-blue-50' : 'bg-green-50'
            }`}
          >
            <Image
              src="/images/ai-logo-icon.png"
              alt="AItrify Logo"
              width={40}
              height={40}
              className="mr-2 rounded-full"
            />
            <div className="flex gap-1">
              <span className="animate-bounce delay-0 w-2 h-2 bg-gray-500 rounded-full"></span>
              <span className="animate-bounce delay-150 w-2 h-2 bg-gray-500 rounded-full"></span>
              <span className="animate-bounce delay-300 w-2 h-2 bg-gray-500 rounded-full"></span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !loading && sendMessage()}
          placeholder={`Bạn muốn hỏi gì ${config.name}?`}
          disabled={loading}
          className="flex-1 border rounded-md px-4 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-900 placeholder:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {loading ? (
          <button
            onClick={abortChat}
            className="w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm sm:text-base"
          >
            Dừng
          </button>
        ) : (
          <button
            onClick={sendMessage}
            className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm sm:text-base"
          >
            Gửi
          </button>
        )}
      </div>
    </div>
  );
}
