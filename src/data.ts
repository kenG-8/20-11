export const greetings = [
  { title: 'Lời chúc đầu trang', message: 'Nhân ngày Nhà giáo Việt Nam 20/11, kính chúc thầy cô luôn mạnh khỏe, hạnh phúc và tràn đầy nhiệt huyết với sự nghiệp trồng người.' },
  { title: 'Người dìu dắt', message: 'Cảm ơn thầy cô đã kiên nhẫn dìu dắt chúng em, không chỉ truyền đạt kiến thức mà còn dạy chúng em cách trưởng thành.' },
  { title: 'Hạt giống niềm tin', message: 'Mỗi bài giảng là một hạt giống, mỗi lời động viên là một nguồn sức mạnh. Cảm ơn thầy cô vì đã luôn tin tưởng và đồng hành cùng chúng em.' },
  { title: 'Chắp cánh ước mơ', message: 'Chúc thầy cô luôn giữ mãi ngọn lửa đam mê, tiếp tục truyền cảm hứng và chắp cánh cho những ước mơ bay xa.' },
  { title: 'Ở lại trong tim', message: 'Tri thức có thể đưa chúng em đến nhiều chân trời mới, nhưng lòng biết ơn dành cho thầy cô sẽ luôn ở lại trong tim.' },
] as const;

export const keepsakes = [
  { id: 'star', name: 'Ngôi sao', title: 'Ánh sáng dẫn đường', message: 'Kính chúc thầy cô luôn rạng rỡ như ánh sao đã soi sáng những năm tháng học trò của chúng em.', color: '#ffce78' },
  { id: 'flower', name: 'Đóa hoa', title: 'Một đóa hoa gửi thầy cô', message: 'Mong mỗi ngày đến lớp đều mang đến cho thầy cô một niềm vui mới, như một đóa hoa vừa nở.', color: '#fa9eaa' },
  { id: 'butterfly', name: 'Cánh bướm', title: 'Những cánh trời mới', message: 'Cảm ơn thầy cô đã cho chúng em đủ tự tin để thử sức, vấp ngã và bay xa hơn mỗi ngày.', color: '#c9abff' },
  { id: 'crystal', name: 'Tinh thể', title: 'Điều quý giá còn mãi', message: 'Những điều thầy cô dạy sẽ còn theo chúng em rất lâu sau tiếng trống tan trường.', color: '#94e8f4' },
  { id: 'plane', name: 'Máy bay giấy', title: 'Gửi theo một ước mơ', message: 'Gửi đến thầy cô lời cảm ơn chân thành từ những học trò vẫn đang lớn lên cùng bao ước mơ.', color: '#fff0cf' },
] as const;

export type Keepsake = (typeof keepsakes)[number];
export type Phase = 'intro' | 'opening' | 'reading' | 'final';
export type Turn = { direction: -1 | 1; id: number };
export type Burst = { kind: 'opening' | 'final' | Keepsake['id']; id: number };

export const OPEN_SECONDS = 1.85;
export const TURN_SECONDS = 0.68;
