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
    color: 'bg-green-50 border-green-300',
  },
  lisa: {
    name: 'LISA',
    greeting:
      'Chào Ông/Bà, LISA rất hân hạnh được trợ giúp về Golf, hơn cả một môn thể thao sang trọng, Golf là Đẳng cấp về sự kết nối của những người Thành đạt!',
    color: 'bg-blue-50 border-blue-300',
  },
};

// --- Footer static topics (dùng chung cho ANNA & LISA) ---
const FOOTER_TOPICS: Record<string, { title: string; content: string }> = {
  'features': {
    title: 'Tính năng',
    content:
      'AItrify đang cập nhật từng ngày cho việc "nạp" kiến thức Chuyên sâu về hàng hóa phục vụ người dùng ngày một tốt hơn:\n' +
      ' • Chat AI với kiến thức chuyên biệt ANNA cho Điều hòa gia dụng, LISA cho Golf và những người tập Golf, hỏi đáp tiếng Việt tự nhiên.\n' +
      ' • Tìm kiếm thông tin sản phẩm Điều hòa gia dụng (bếp, máy xay sinh tố, nồi cơm... với giá Top Ưu đãi nhưng vẫn được hưởng dịch vụ chuẩn hãng.\n' +
      ' • Tìm kiếm thông tin sản phẩm cho chơi thể thao Golf, công cụ dụng cụ, thiết bị hỗ trợ chơi Golf, tập Golf, thời trang, phục kiện cho Golf\n' +
      ' • Dữ liệu tách biệt theo loại Sản phẩm hàng hóa và cá nhân hóa; không dùng để huấn luyện mô hình AI công khai (public).'
  },
  'integrations': {
    title: 'Tích hợp',
    content:
      'AItrify đang cập nhật từng ngày cho các tích hợp nhiều tính năng phục vụ người dùng ngày một tốt hơn:\n' +
      ' • Kết nối các hệ thống ERP / Thanh toán / Vận chuyển/Kho chứa hàng, xuất hoá đơn điện tử để dần mang lại trải nghiệm tìm kiếm và mua hàng mới\n' +
      ' • AItrify dần bổ sung tích hợp các cổng thanh toán, các hãng sản phẩm uy tín, các trung tâm dịch vụ khách hàng để mang lại không chỉ sản phẩm mà là Dịch vụ khách hàng chuẩn hãng.\n' +
      ' • Tích hợp nhiều nguồn dữ liệu có kiểm chứng, có xác thực, dữ liệu cá nhân hóa được tổng hợp nhờ tích hợp dữ liệu khép kín\n' +
      ' • Hỗ trợ đồng bộ các phần mềm của doanh nghiệp của đối tác nếu có nhu cầu như ERP/CRM, phần mềm kế toán doanh nghiệp; bộ SDK & API sẽ mở dần theo lộ trình.'
  },
  'pricing': {
    title: 'Chi phí & Gói dịch vụ',
    content:
      'AItrify đang triển khai dần các các tùy chọn để người dùng thấy xứng đáng với chi phí bỏ ra:\n' +
      ' • Giai đoạn đầu: miễn phí AItrify ANNA/LISA cho người dùng đăng ký/không đăng ký.\n' +
      ' • Cung cấp Điều hòa gia dụng chỉ của hãng Nagakawa, một hãng uy tín lâu đời tại Việt nam với 23 năm kinh nghiệm.\n' +
	    ' • Cung cấp các sản phẩm Golf mà AItrify đã thẩm định là Chính hãng và có hóa đơn, giấy tờ xuất xứ đầy đủ theo đúng pháp luật Việt Nam\n' +
      ' • Thanh toán chuyển khoản/QR; hoá đơn điện tử đầy đủ.\n' +
      ' • Chương trình khuyến mãi và chương trình ưu đãi theo từng thời điểm.'
  },
  'brands': {
    title: 'Hãng sản xuất',
    content:
      '• Chỉ nhận hàng CHÍNH HÃNG, có nguồn gốc xuất xứ & hoá đơn hợp lệ.\n' +
      '• Đối tác/Hãng muốn hợp tác vui lòng liên hệ gửi mail tới: chairm@beeinc.vn.'
  },
  'policies': {
    title: 'Chính sách',
    content:
      '• Tổng quan: đổi trả theo chính sách từng thời điểm; bảo hành theo hãng.\n' +
      '• Vận chuyển/khuyến mại có thể thay đổi theo chiến dịch.\n' +
      '• Vui lòng xem thêm: Thỏa thuận EUA, Điều khoản dịch vụ, Chính sách bảo mật.'
  },

  'about': {
    title: 'Về AItrify',
    content:
      'Ra mắt bản thử nghiệm đầu tiên vào ngày 02/09/2025, AItrify được thiết kế định hướng là nền tảng thương mại điện tử sử dụng hầu hết công nghệ trí tuệ nhân tạo AI để giúp cho hoạt động tìm kiếm mua sắm dễ dàng hơn hàng chính hãng với giá cả thuộc top ưu đãi nhất. ' +
      'Bạn có thể giao tiếp với các trợ lý AI của AItrify được thiết kế và đào tạo với kiến thức chuyên sâu, chuyên biệt với ANNA dành cho sản phẩm điều hòa gia dụng, LISA chuyên biệt dành cho Golf và Golfer ' +
      'AItrify được xây dựng bởi Liên minh công nghệ Beesota6G gồm các công ty công nghệ mạnh trong các lĩnh vực AI, Blockchain, Robotics, Cloud, I/IoT, ERP (Xem thêm tại https://beesota.com/)'
  },
  'vision': {
    title: 'Tầm nhìn & Sứ mệnh',
    content:
      'Tầm nhìn: Đưa AI vào mọi mặt của đời sống tại Việt Nam, không để ai bị bỏ lại phía sau trong làn sóng công nghệ tiên tiến trên toàn thế giới. ' +
      'Bất kể ai với thu nhập dù có thấp hay cao cũng đều xứng đáng được hưởng sản phẩm dịch vụ chính hãng thông qua sự trợ giúp của AI và các công nghệ tiên tiến khác.'
  },
  'technology': {
    title: 'Công nghệ AItrify',
    content:
      'AItrify sử dụng các công nghệ AI mới nhất với LLM, ANN, OpenCV, RAG để nạp tri thức cho AItrify cùng với công nghệ SAITMe (structured) & NoSAITMe (unstructured) ' + 
      'của Beesota6G (https://beesota.com/) tự phát triển. Công nghệ AI nào mới nhất cũng luôn sớm có mặt trên AItrify, tích hợp với các nguồn dữ liệu khác được xác thực, có dẫn chiếu, ' + 
      'và cả dữ liệu từ các thiết bị IoT qua công nghệ truyền số liệu tiên tiến nhất cho dữ liệu Số.'
  },
  'careers': {
    title: 'Tuyển dụng',
    content:
      'Chúng tôi tìm Đồng đội tham gia vào xây dựng Nền tảng Thương mại điện tử AI.Commerce: người có khả năng kinh doanh cao, người có đam mê về khoa học dữ liệu, người có khả năng phân tích về khoa học xã hội. ' +
      'Không quan trọng bạn tốt nghiệp trường đại học nào, chỉ cần bạn đóng góp vào vận hành dòng chảy Thông tin để kích thích dòng chảy Hàng hóa qua nền tảng thương mại điện tử ' +
      'thế hệ mới AItrify với 2 trợ lý AI chuyên biệt đầu tiên ANNA/LISA, bạn đều có thể trở thành đồng đội của chúng tôi. ' +
      'Đừng ngại ngần, hãy gửi mail tới: chairm@beeinc.vn kèm CV nói về bạn.'
  },
  'investors': {
    title: 'Dành cho Nhà đầu tư',
    content:
      'Chúng tôi chào đón các nhà đầu tư có "Khẩu vị" và "Tầm nhìn" trong việc đẩy nhanh dòng chảy Thông tin để kích thích dòng chảy Hàng hóa giúp tăng cao Tốc độ dòng tiền, ' +
      'để có thể vừa phục vụ được người dân Việt Nam mua hàng/bán hàng CHÍNH HÃNG nhanh nhất với giá Ưu đãi nhất, và vừa có điều kiện để tăng cường Công nghệ cho nền tảng AItrify tốt hơn Mỗi ngày. ' +
      'Nếu bạn quan tâm đầu tư, chúng tôi vô cùng cảm kích, chỉ cần gửi mail tới chairm@beeinc.vn, hội đồng quan hệ nhà đầu tư IR của chúng tôi sẽ lập tức quan tâm tới đề nghị Đầu tư của Bạn.'
  },
  'partners': {
    title: 'Dành cho Hãng/Đối tác',
    content:
      'Với Tầm nhìn và Sứ mệnh chính đó là qua nền tảng thương mại điện tử công nghệ AI (AI.Commerce), để phục vụ bất kể ai với thu nhập dù có thấp hay cao cũng đều xứng đáng được hưởng sản phẩm dịch vụ chính hãng ' +
      'với Top giá Ưu đãi nhất, thông qua sự trợ giúp của AI và các công nghệ tiên tiến khác. ' +
      'Chúng tôi chào đón các Hãng sản phẩm có thể cung cấp không chỉ hàng chính hãng tuân thủ theo Pháp luật Việt Nam mà còn đi kèm Dịch vụ sau bán hàng Tận tâm cho khách hàng, cho dù giá trị món hàng thấp hay cao.'
  },
  'eua': {
    title: 'Thoả thuận EUA',
    content:
      'Mọi người dùng tham gia hoạt động trên nền tảng thương mại điện tử AI.Commerce AItrify phải tuân theo pháp luật Việt Nam. ' +
      'Mọi đối tác hay hàng hóa đăng trên AItrify đều phải là hàng hóa Chính hãng, có đầy đủ giấy tờ nguồn gốc xuất xứ, có hóa đơn đầu vào. ' +
      'Mọi thông tin mà đối tác cung cấp để các trợ lý AI (ANNA/LISA) tư vấn cho người dùng đều phải xác thực, không gây lầm lẫn. ' +
      'Các hàng hóa cung cấp trên AItrify sẽ phải có hóa đơn, giấy tờ nguồn gốc xuất xứ rõ ràng để AItrify tuân thủ nghĩa vụ thuế và chống hàng giả hàng nhái. ' +
      'Người dùng được miễn phí hoặc hưởng phí dịch vụ ưu đãi tùy theo từng thời điểm AItrify công bố.'
  },
  'terms': {
    title: 'Điều khoản dịch vụ',
    content:
      'Người dùng khi đăng ký thông tin trên AItrify cần chấp nhận điều khoản sử dụng, bao gồm việc ủy quyền cho AItrify truy nhập và xử lý dữ liệu để cải thiện dịch vụ. ' +
      'Giá cả và ưu đãi có thể thay đổi tùy theo thời điểm và chính sách của hãng/nhãn hàng; AItrify sẽ thông báo cho người dùng hoặc thể hiện trong kết quả tìm kiếm. ' +
      'Các chính sách đổi trả, vận chuyển miễn phí hay khuyến mại đều được điều chỉnh tùy theo từng giai đoạn và sẽ được AItrify thông báo rõ ràng cho người dùng. ' +
      'Bằng việc tiếp tục sử dụng dịch vụ, người dùng đồng ý tuân thủ toàn bộ điều khoản này.'
  },
  'privacy': {
    title: 'Chính sách bảo mật',
    content:
      'AItrify cam kết bảo vệ thông tin cá nhân và dữ liệu giao dịch của người dùng. Mọi dữ liệu thu thập, lưu trữ và xử lý đều tuân thủ pháp luật Việt Nam. ' +
      'AItrify không sử dụng dữ liệu người dùng để huấn luyện các mô hình AI công khai. ' +
      'Dữ liệu chỉ được chia sẻ với đối tác liên quan (thanh toán, vận chuyển) khi cần thiết cho giao dịch. ' +
      'Người dùng đăng ký có quyền không đồng ý tại thời điểm đăng ký dịch vụ và dịch vụ sẽ được hủy ngay từ khi không đăng ký thành công' +
      'Người dùng không đăng ký thì chấp nhận mọi Cookies mà chúng tôi lưu trong quá trình các bạn duyệt web tại trang AItrify của chúng tôi'
  },
  'guide/getting-started': {
    title: 'Sử dụng AItrify',
    content:
      'Bắt đầu: 1) Truy cập www.aitrify.com, 2) chọn trợ lý AI là ANNA hoặc LISA thông qua nhấn một trong hai nút ' + 
      'nhãn "ANNA Điều hòa & gia dụng" hoặc nhãn "LISA Golf&Golfer", 3) Nhấn nút "Mua hàng tại AItrify" để được hướng dẫn về mua hàng hóa chính hàng trên AItrify. Gõ câu hỏi vào ô bên dưới rồi nhấn Enter hoặc nhấn nút "Gửi". ' +
      'Hiện tại, AItrify đang miễn phí tìm kiếm hay trả lời cho dù bạn có đăng ký tài khoản hay không.'
  },
  'guide/signup': {
    title: 'Đăng ký AItrify',
    content:
      'Hiện tại, AItrify chuẩn bị bước đấu áp dụng đăng ký qua email. Khi có tính năng này bạn chỉ cần Nhấn nút Đăng ký và điền thông tin, nếu là người dùng tổ chức có thể nhập thêm thông tin công ty. ' + 
      'Người dùng đăng ký có thêm quyền hỏi nhiều câu hỏi hơn so với người dùng không đăng ký, nhận được thông tin chi tiết hơn và các ưu đãi khác tùy theo chính sách từng thời điểm. ' + 
      'AItrify cũng cho phép đăng ký bằng tài khoản Gmail qua nút "Đăng ký với Gmail" trong quá trình đăng ký.'
  },
  'guide/purchase': {
    title: 'Mua hàng với AItrify',
    content:
      'Về dịch vụ: Hiện tại trong thời gian đang miễn phí dịch vụ AItrify tuy nhiên có thể có hạn chế về lượt hỏi AItrify hoặc yêu cầu đăng ký, mong bạn thông cảm nếu có bất cứ bất tiện nào.  \n' + 
      'Về mua hàng hóa tìm kiếm được trên AItrify hiện tại sẽ theo cách thức sau khi bạn tìm được hàng hóa phù hợp trên www.aitrify.com thì bạn có thể liên hệ tới số hotline: 0823830506 hoặc gửi mail tới chairm@beeinc.vn hoặc ha.mai@beeinc.vn. \n' + 
      'AItrify chấp nhận thanh toán chuyển khoản ngân hàng, thông qua QR code và sẽ dần bổ sung nhiều hình thức thanh toán thuận tiện hơn. ' + 
      'Khi thanh toán sẽ có hóa đơn tài chính xuất kèm cho quý khách. Một cách thanh toán áp dụng với mọi loại hàng hóa dịch vụ trên AItrify mà ANNA/LISA tư vấn cung cấp.'
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
      'AItrify được xây dựng trên cơ sở dữ liệu chính thống từ các hãng sản xuất và nhãn hàng. Tuy nhiên, các thông tin liên quan đến giá cả tại thời điểm mua hàng, mẫu mã, chương trình khuyến mại và các thông tin khác chưa được huấn luyện cập nhật trong hệ thống chỉ mang tính tham khảo.\n' +
      'Quý khách vui lòng liên hệ theo hotline và email tại mục "Mua hàng tại AItrify" để nhận thông tin chính thống và chính xác nhất. Trong mọi trường hợp khác, công ty sở hữu AItrify được miễn trừ hoàn toàn trách nhiệm pháp lý đối với các thông tin không chính xác.\n\n' +
      'AItrify được miễn trừ trách nhiệm pháp lý liên quan đến thông tin trong giấy tờ xuất xứ, hóa đơn và nghĩa vụ thuế do nhãn hàng cung cấp.\n\n' +
      'Bằng việc nhập thông tin tìm kiếm, sử dụng và/hoặc đăng ký AItrify, người dùng đồng ý rằng AItrify được miễn trừ toàn bộ trách nhiệm pháp lý đối với các thông tin người dùng nhập vào cũng như thông tin phản hồi từ hệ thống. Người dùng đồng ý để AItrify lưu trữ thông tin nhập liệu và thông tin đăng ký tài khoản.\n\n' +
      'AItrify cũng được miễn trừ trách nhiệm trong các trường hợp bất khả kháng như thiên tai, sự cố kỹ thuật ngoài tầm kiểm soát, hoặc sự gián đoạn dịch vụ do nguyên nhân khách quan khác.'
  },
};


export default function Chatbox({ agent }: ChatboxProps) {
  const config = AGENT_CONFIGS[agent] || AGENT_CONFIGS['anna'];
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [chatHistories, setChatHistories] = useState<Record<string, { sender: string; text: string }[]>>({
    anna: [{ sender: 'ai', text: AGENT_CONFIGS.anna.greeting }],
    lisa: [{ sender: 'ai', text: AGENT_CONFIGS.lisa.greeting }],
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

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

    const aiResponse = await mockChatAPI(input);


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



  const mockChatAPI = async (userInput: string) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userInput, user_login: USER_LOGIN, agent }),
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
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={`Bạn muốn hỏi gì ${config.name}?`}
          className="flex-1 border rounded-md px-4 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-900 placeholder:text-blue-300"
        />
        <button
          onClick={sendMessage}
          className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm sm:text-base"
        >
          Gửi
        </button>
      </div>
    </div>
  );
}
