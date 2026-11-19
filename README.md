# Sách Tri Ân · 20/11

Website tương tác mừng ngày Nhà giáo Việt Nam. Cuốn sách, thư viện và các vật phẩm được dựng bằng hình học Three.js. Chữ và hoa văn in trên sách được vẽ bằng Canvas 2D với phông chữ tiếng Việt lưu trong dự án.

## Chạy trên Windows

Yêu cầu Node.js 22.12+ hoặc Node.js 24.

```powershell
Set-Location 'D:\CODE\the-magical-book'
npm.cmd install
npm.cmd run dev
```

Mở địa chỉ Vite in trong terminal (thường là `http://localhost:5173`). Dùng `npm.cmd run build` để kiểm tra TypeScript và tạo bản phát hành trong `dist`; dùng `npm.cmd run preview` để chạy thử bản phát hành.

Chạm vào bìa để mở sách. Chạm vào trang, dùng phím mũi tên hoặc vuốt ngang để lật. Năm vật phẩm quanh sách đều có lời chúc riêng; cũng có thể chọn chúng từ các nút phía dưới. Trình duyệt không có WebGL 2 sẽ tự chuyển sang bản đọc HTML.

## Nhạc nền

Bài "Người gieo mầm xanh" – Hứa Kim Tuyền × Hoàng Dũng được lưu tại `public/audio/nguoi-gieo-mam-xanh.mp3`, giữ nguyên file MP3. Trang thử phát khi vừa mở. Nếu trình duyệt chặn tự phát có tiếng, thao tác mở sách cũng bật nhạc. Nút loa điều khiển cả nhạc nền và hiệu ứng âm thanh. Nhạc lặp lại khi hết bài; tắt rồi bật lại sẽ tiếp tục tại vị trí đang nghe. Trang ghi nhớ lựa chọn tắt tiếng trong tab hiện tại.

## Đưa lên Cloudflare Pages

Sau lời chúc thứ 5, lật tiếp để mở Cuốn Sách Ngân Hà. Trang này dùng chung trình phát nhạc với cuốn sách, nên bài hát tiếp tục ở đúng vị trí khi chuyển cảnh.

Sau khi chạy `npm.cmd run build`, tải nội dung thư mục `dist` hoặc file `cloudflare-pages-ngan-ha.zip` lên Cloudflare Pages bằng Direct Upload. Tải bản build, không tải toàn bộ thư mục dự án hoặc `node_modules`.
