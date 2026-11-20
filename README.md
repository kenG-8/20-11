# Sách Tri Ân · 20/11

Website tương tác mừng ngày Nhà giáo Việt Nam. Mở cuốn sách 3D, lật trang và khám phá năm lời chúc gửi đến thầy cô. Sau lời chúc thứ năm, lật tiếp để mở Cuốn Sách Ngân Hà. Nhạc nền tiếp tục phát khi chuyển cảnh.

## 1. Tải mã nguồn

Cài [Node.js 24 LTS](https://nodejs.org/) hoặc Node.js 22 từ bản 22.12 trở lên. Node.js đi kèm npm. Mở terminal mới và chạy `node -v` và `npm -v` để kiểm tra.

**Dùng Git:** Cài [Git](https://git-scm.com/downloads), mở terminal ở thư mục bạn muốn lưu dự án rồi chạy:

```sh
git clone https://github.com/kenG-8/20-11.git
cd 20-11
```

**Tải ZIP:** Trên [trang GitHub của dự án](https://github.com/kenG-8/20-11), chọn **Code → Download ZIP**, giải nén, rồi mở terminal trong thư mục vừa giải nén có tệp `package.json`. Cách này không cần cài Git.

## 2. Cài và chạy website

Chạy các lệnh sau trên Windows, macOS hoặc Linux, trong thư mục có `package.json`. Máy cần kết nối mạng khi cài thư viện lần đầu.

```sh
npm install
npm run dev
```

Mở địa chỉ **Local** hiện trong terminal, thường là [http://localhost:5173](http://localhost:5173). Giữ terminal mở khi dùng website; nhấn **Ctrl+C** để dừng. Trên Windows, nếu PowerShell chặn `npm.ps1`, dùng `npm.cmd install` và `npm.cmd run dev`.

## 3. Tạo bản build

```sh
npm run build
npm run preview
```

Lệnh `build` kiểm tra TypeScript rồi xuất website vào `dist/`. Lệnh `preview` để xem bản build trên máy, thường tại [http://localhost:4173](http://localhost:4173). Nếu PowerShell chặn `npm.ps1`, dùng `npm.cmd` cho hai lệnh trên.

Để đưa lên Cloudflare Pages bằng Direct Upload, tải thư mục `dist/` hoặc một tệp ZIP có `index.html` của bản build ở cấp ngoài cùng. Không tải thư mục `node_modules` hay ZIP mã nguồn.

## Lỗi thường gặp

- **`ENOENT: Could not read package.json`:** Terminal đang ở sai thư mục. Dùng `dir package.json` trên Windows hoặc `ls package.json` trên macOS/Linux. Nếu không thấy tệp, chuyển vào thư mục đã clone hoặc giải nén, rồi chạy lại lệnh npm.
- **Không nghe nhạc khi vừa mở:** Một số trình duyệt chặn tự phát có tiếng. Chạm vào bìa sách hoặc bấm biểu tượng loa. Nhạc nền “Người gieo mầm xanh” của Hứa Kim Tuyền và Hoàng Dũng nằm trong `public/audio/nguoi-gieo-mam-xanh.mp3`.
- **Không hiện cảnh 3D:** Nếu trình duyệt không hỗ trợ WebGL 2, website tự chuyển sang bản đọc HTML.
