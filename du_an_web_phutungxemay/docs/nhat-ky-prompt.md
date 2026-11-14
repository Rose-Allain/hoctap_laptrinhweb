# Nhật ký sử dụng AI (Prompt Log)

## Thông tin chung

- **Đề tài:** Website cửa hàng phụ tùng xe máy
- **Công nghệ theo yêu cầu ban đầu:** Node.js, Express.js, PostgreSQL (pg), HTML, CSS, JavaScript thuần, Tailwind CSS CDN, GitHub Actions
- **Người thực hiện:** [Điền họ tên]
- **Lớp / mã sinh viên:** [Điền thông tin nếu được yêu cầu]
- **Công cụ AI:** ChatGPT / Codex
- **Phạm vi nhật ký:** Tổng hợp các yêu cầu còn trong lịch sử hội thoại và bản nhật ký hiện có của dự án. Ngày không có trong hội thoại được để là “không ghi nhận”, không tự suy đoán.

## Nhật ký theo trình tự

### Lần 1 — Đặc tả và khởi tạo website

- **Ngày:** Không ghi nhận trong lịch sử hội thoại.
- **Prompt đã dùng (tóm lược đầy đủ):**

  > Đóng vai chuyên gia Fullstack Developer. Viết code và tạo cấu trúc thư mục hoàn chỉnh cho website thương mại điện tử bán phụ tùng xe máy. Backend dùng Node.js, Express.js và PostgreSQL qua thư viện pg. Frontend dùng HTML, CSS, JavaScript thuần và Tailwind CSS qua CDN, không dùng React/Vue hoặc framework frontend. Tạo script database cho categories, products, users, orders, order_items; cấu hình pool PostgreSQL bằng biến môi trường; tạo Express server, API GET /api/products; làm trang chủ có navbar, danh sách sản phẩm và giỏ hàng lưu localStorage; thêm GitHub Actions chạy khi push nhánh main và deploy VPS qua SSH; hướng dẫn cách cài và chạy dự án.

- **Mục đích:** Chuyển yêu cầu bài toán thành cấu trúc ứng dụng, database, API, giao diện ban đầu và hướng dẫn cài đặt.
- **Kết quả ghi nhận:** Dự án có các phần database, cấu hình kết nối, Express server, controller/route sản phẩm, thư mục frontend tĩnh, cấu hình npm và workflow deploy. Các tên file được yêu cầu gồm database/init.sql, config/db.js, server.js, controllers/productController.js, routes/productRoutes.js, public/index.html, public/js/main.js và .github/workflows/deploy.yml.
- **Vấn đề / lưu ý:** Cần đối chiếu schema và workflow với source hiện tại trước khi nộp; thông tin đăng nhập database và secrets triển khai phải được cấu hình riêng, không đưa vào nhật ký.
- **Điều rút ra:** Nên chốt công nghệ, cấu trúc dữ liệu và các luồng chính trước khi triển khai từng phần.

### Lần 2 — Chạy website trên máy cá nhân

- **Ngày:** Không ghi nhận trong lịch sử hội thoại.
- **Prompt nguyên văn:**

  > tôi muốn chạy lên local để xem giao diện

- **Mục đích:** Mở website trên máy cá nhân để xem giao diện và xác nhận server hoạt động.
- **Kết quả ghi nhận:** Trong lần chạy được ghi lại, server chạy cục bộ trên cổng 3000 và trang gốc trả HTTP 200. Giao diện có thể xem trên trình duyệt. Kết nối PostgreSQL chưa thành công do thông tin xác thực mặc định chưa được cấu hình đúng; vì vậy lần kiểm tra đó chưa xác nhận truy vấn dữ liệu thật từ database.
- **Vấn đề / lưu ý:** Cần cấu hình PostgreSQL và các biến môi trường cần thiết trước khi xác nhận luồng dữ liệu sản phẩm. Không đưa giá trị bí mật trong .env vào tài liệu.
- **Điều rút ra:** Cần kiểm tra riêng server, giao diện và kết nối database; việc trang chủ trả HTTP 200 chưa chứng minh database đã hoạt động.

### Lần 3 — Nâng cấp giao diện cửa hàng

- **Ngày:** Không ghi nhận trong lịch sử hội thoại.
- **Prompt nguyên văn:**

  > Đóng vai một nhà thiết kế website cao cấp đẳng cấp thế giới. Hãy xây dựng một website hoàn chỉnh cho cửa hàng phụ tùng xe máy của tôi, hướng đến nhiều loại khách hàng. Lên kế hoạch cho các phần nội dung lý tưởng, phong cách hình ảnh cao cấp, bố cục, tương tác, nội dung thuyết phục và các CTA tập trung vào chuyển đổi. Hãy khiến website có cảm giác như một website được thiết kế chuyên nghiệp trị giá 10.000 USD.

- **Mục đích:** Cải thiện nhận diện, bố cục, nội dung và trải nghiệm mua sắm để website thuyết phục hơn với nhiều nhóm khách hàng.
- **Kết quả ghi nhận:** Giao diện được phát triển theo hướng cửa hàng phụ tùng hiện đại, có khu vực giới thiệu, nội dung hướng đến người đi xe/người chơi xe/gara, hiển thị sản phẩm, tìm kiếm và lọc, giỏ hàng, CTA và bố cục responsive. Một số hình minh họa được dựng bằng SVG/CSS.
- **Vấn đề / lưu ý:** Tên thương hiệu, ảnh, thông tin cửa hàng, giá và dữ liệu sản phẩm cần được đối chiếu với thông tin kinh doanh thực tế. Giao diện đẹp không thay thế việc kiểm tra nội dung và luồng mua hàng.
- **Điều rút ra:** CTA, nội dung đúng nhóm khách hàng và khả năng dùng trên điện thoại cần được thiết kế cùng với phần hình ảnh.

### Lần 4 — Tách nội dung thành các trang riêng

- **Ngày:** Không ghi nhận trong lịch sử hội thoại.
- **Prompt nguyên văn:**

  > chia các sản phẩm, danh mục, giới thiệu, liên hệ thành những trang riêng

- **Mục đích:** Tách các nhóm nội dung để khách hàng điều hướng và tìm thông tin rõ ràng hơn.
- **Kết quả ghi nhận:** Các trang sản phẩm, danh mục, giới thiệu và liên hệ được tổ chức thành các trang riêng trong public; điều hướng dùng chung giữa các trang. Trang sản phẩm dùng API/dữ liệu demo và giỏ hàng; trang danh mục trình bày sản phẩm theo nhóm; trang liên hệ có chỗ cấu hình thông tin cửa hàng.
- **Vấn đề / lưu ý:** Cần kiểm tra liên kết giữa các trang, trạng thái giỏ hàng khi chuyển trang, dữ liệu khi API không phản hồi và thay placeholder bằng thông tin liên hệ chính xác.
- **Điều rút ra:** Phân chia trang theo mục đích giúp điều hướng mạch lạc, nhưng cần giữ header, footer và phong cách nhất quán.

### Lần 5 — Rà soát và tinh chỉnh giao diện

- **Ngày:** 27/10/2026 (theo bản nhật ký có sẵn trong dự án).
- **Prompt nguyên văn:**

  > đọc lại source code của tôi và tối ưu lại giao diện

- **Mục đích:** Rà soát giao diện đang có và cải thiện khả năng đọc, thao tác trên máy tính và điện thoại.
- **Kết quả ghi nhận trong nhật ký trước:** Đã bổ sung tinh chỉnh CSS cho ảnh sản phẩm, nội dung thẻ sản phẩm, bộ lọc trên màn hình nhỏ, vùng chạm và trạng thái focus bàn phím. Bản nhật ký trước ghi file được chỉnh sửa là public/css/shop-redesign.css.
- **Kiểm tra:** Nhật ký hiện có ghi chưa chạy ứng dụng hoặc kiểm tra trực quan bằng trình duyệt sau lượt tinh chỉnh đó.
- **Vấn đề / lưu ý:** Cần xác minh đường dẫn file và xem lại giao diện thực tế trước khi báo cáo hoàn tất.
- **Điều rút ra:** Tinh chỉnh responsive và hỗ trợ bàn phím cần được kiểm tra trực tiếp trên các kích thước màn hình phù hợp.

### Lần 6 — Tổng hợp nhật ký theo yêu cầu giảng viên

- **Ngày:** 27/10/2026.
- **Prompt nguyên văn:**

  > tôi cần gom lại thành nhật kí promt theo yêu cầu của thầy tôi

- **Mục đích:** Ghi lại quá trình dùng AI và kết quả theo từng lần yêu cầu.
- **Kết quả:** Tổng hợp prompt, mục đích, kết quả ghi nhận, vấn đề và bài học cho các giai đoạn còn trong lịch sử hội thoại; giữ chỗ để người học bổ sung thông tin cá nhân.
- **Vấn đề / lưu ý:** Chưa có biểu mẫu chấm riêng của giảng viên trong thư mục dự án này. Một tài liệu khung ở thư mục lân cận mô tả một bài tập website tĩnh khác và có yêu cầu công nghệ mâu thuẫn với dự án hiện tại, nên không dùng nó làm đặc tả cho dự án thương mại điện tử này.
- **Điều rút ra:** Nhật ký cần phản ánh đúng prompt và kiểm tra đã thực hiện; không ghi ngày, kết quả kiểm thử hoặc thông tin chưa được xác nhận.

## Tổng kết

Quá trình được ghi nhận đi từ việc xác định stack và cấu trúc website, nâng cấp giao diện, tách trang chức năng, đối chiếu rubric, bổ sung đăng nhập admin/session và EJS partials, đến chạy thành công trên localhost kèm database PostgreSQL thật, cấp lại tài khoản quản trị và thêm bộ lọc nhóm sản phẩm trong trang admin. Nhật ký phân biệt thay đổi trong source với các hạng mục đã kiểm chứng (HTTP status, dữ liệu trả về, trình duyệt headless) và phần chưa xác minh; sinh viên cần xác minh lại trên môi trường của nhóm trước khi nộp.

## Checklist trước khi nộp

- [ ] Điền họ tên, lớp/mã sinh viên và ngày tháng nếu giảng viên yêu cầu.
- [ ] Đối chiếu tên file và kết quả ghi nhận với source hiện tại.
- [ ] Chỉ ghi các bước kiểm thử đã thực sự chạy; bổ sung ảnh minh chứng nếu được yêu cầu.
- [ ] Xác nhận biểu mẫu hoặc tiêu chí chính thức với tài liệu môn học.
- [ ] Không đính kèm nội dung .env, mật khẩu, API key hoặc GitHub secrets.


### Lần 7 — Đối chiếu với yêu cầu báo cáo trong ảnh

- **Ngày:** 27/10/2026.
- **Prompt nguyên văn:**

  > đây là yêu cầu trước khi báo cáo xem còn thiếu gì trong ảnh thì hãy làm cho phù hợp để có thể báo cáo

- **Mục đích:** Đối chiếu source và nhật ký prompt với các mục trong đề cương báo cáo của giảng viên.
- **Thiếu sót AI được phát hiện:** Bản nhật ký trước chỉ tổng hợp prompt, chưa đối chiếu rubric báo cáo; chưa nêu rõ khoảng trống đăng nhập/session, EJS/partials, phân công, ERD, ảnh giao diện, kết luận và tài liệu tham khảo.
- **Cách người dùng phát hiện và xử lý:** Người dùng cung cấp ảnh tiêu chí. Sau đó rà soát route, middleware, controller, frontend và database schema; phân biệt khóa API + sessionStorage phía trình duyệt với đăng nhập/session phía server. Bổ sung docs/bao-cao.md và database/seed_demo.sql có dữ liệu hoàn toàn minh họa.
- **Kết quả:** Báo cáo hiện có sơ đồ MVC/ER, bảng route, bảng trạng thái tính năng, từ điển dữ liệu, nội dung AI log, danh sách ảnh cần chụp và checklist còn lại. Tạo .env.example không chứa bí mật để hỗ trợ cấu hình.
- **Giới hạn tại thời điểm của lần rà soát đó:** Chưa triển khai đăng nhập/session hoặc EJS/partials; chưa chạy seed SQL, kiểm thử hoặc chụp ảnh giao diện. Các khoảng trống này được ghi trong bản báo cáo lúc đó; chúng được xử lý tiếp ở lần 8.
- **Bài học:** Đọc rubric trước khi viết báo cáo; dùng source làm bằng chứng; không tự điền tên/MSSV, kết quả chạy, ảnh hoặc chức năng chưa tồn tại.


### Lần 8 — Bổ sung đăng nhập/session, EJS và đồng bộ báo cáo

- **Ngày:** 27/10/2026.
- **Prompt nguyên văn:**

  > sau khi hoàn thành thì cập nhật nhật kí promt

- **Mục đích:** Hoàn thiện các điểm còn thiếu theo rubric đã cung cấp trước đó, sau đó cập nhật báo cáo và nhật ký.
- **Kết quả:** Bổ sung đăng nhập admin bằng email/mật khẩu hash scrypt, session cookie phía server, đăng xuất và middleware bảo vệ API; thêm trang admin EJS với partials; thêm tiện ích tạo tài khoản quản trị ban đầu và cấu hình Render Blueprint. Cập nhật `.env.example` và `docs/bao-cao.md` để phản ánh đúng trạng thái.
- **Sai sót AI và cách phát hiện/sửa:** Bản báo cáo chưa được đồng bộ sau khi login/session/EJS được thêm, nên còn câu khẳng định các phần này chưa tồn tại. Khi rà lại các cụm cũ và so với source, AI phát hiện mâu thuẫn rồi sửa các phần phạm vi, yêu cầu, luồng session, bảng route, mã tiêu biểu, kết luận và checklist. AI cũng bỏ sót khai báo `AUTH_ROOT` trong JavaScript quản trị; kiểm tra tĩnh phát hiện biến được dùng nhưng chưa khai báo, sau đó bổ sung giá trị `/api/auth`.
- **Kiểm tra đã thực hiện:** Đọc lại các file cấu hình, route, controller, middleware, template và đối chiếu các câu trong báo cáo. Chưa chạy ứng dụng, chưa chạy test, chưa kết nối database, chưa chạy seed và chưa chụp ảnh; vì vậy chưa xác nhận đăng nhập/CRUD hoạt động ở runtime.
- **Giới hạn còn lại:** Session store vẫn là MemoryStore mặc định; storefront vẫn HTML tĩnh; chưa có đăng nhập khách hàng/thanh toán online; chưa triển khai Render/Neon hoặc VPS trong lượt này. Cần điền tên/MSSV, chụp giao diện thật, kiểm tra các luồng và xác nhận URL deploy trước khi nộp.
- **Bài học:** Sau thay đổi code cần rà lại toàn bộ báo cáo để xóa nhận định cũ; kiểm tra tích hợp static không thay thế cho chạy thử ứng dụng, database và trình duyệt.

### Lần 9 — Chạy dự án trên localhost thành công

- **Ngày:** 05/11/2026.
- **Prompt nguyên văn:**

 > build localhost

- **Mục đích:** Khởi động toàn bộ dự án trên máy cá nhân và xác nhận server, database và giao diện hoạt động thật.
- **Kết quả:** Cài phụ thuộc, chạy server trên cổng 3000; kiểm tra bằng HTTP request và trình duyệt headless. `/`, `/products/`, `/categories/`, `/about/`, `/contact/`, `/admin/` trả HTTP 200; `/api/health` trả `{"status":"ok"}`; `/api/products` trả dữ liệu thật từ PostgreSQL local (database `motorcycle_parts`). Ảnh chụp trang chủ xác nhận giao diện render đầy đủ, 0 lỗi console.
- **Vấn đề / lưu ý:** `npm start` bị chặn bởi Execution Policy của PowerShell (npm.ps1 không chạy được script), nên khởi động trực tiếp bằng `node server.js` (chạy nền detached). Đây là lần đầu dự án được xác nhận chạy kèm database thật (khác với lần 2 khi kết nối database chưa thành công).
- **Điều rút ra:** Khi npm bị chặn bởi chính sách thực thi, vẫn có thể chạy bằng `node` trực tiếp hoặc đổi chính sách ở scope CurrentUser; kiểm tra từng route bằng HTTP request cho bằng chứng cụ thể hơn một lần chạy chung chung.

### Lần 10 — Cấp lại tài khoản quản trị cho trang admin

- **Ngày:** 05/11/2026.
- **Prompt nguyên văn:**

 > cho tôi tài khoàn trang admin

- **Mục đích:** Lấy thông tin đăng nhập khu vực quản trị `/admin/` để vào được workspace quản lý sản phẩm, bảng giá và hóa đơn.
- **Kết quả:** Truy database `motorcycle_parts`: tồn tại một user `admin@rideform.local` (role `admin`) nhưng mật khẩu cũ không thể dùng lại, nên đặt lại mật khẩu mới (hash scrypt đúng định dạng `lib/password.js`, đảm bảo `role='admin'`, `is_active=TRUE`). Đăng nhập thử bằng trình duyệt headless qua đúng luồng `/api/auth/login` của trang: vào được dashboard “Chào bạn, admin” với dữ liệu thật (26 sản phẩm, 25 hóa đơn).
- **Vấn đề / lưu ý:** Script tạm dùng để đọc/đặt mật khẩu và file QA đã được xóa, không để lại file rác. Không đưa mật khẩu vào các file cấu hình hay log dài hạn; đây chỉ là tài khoản cho môi trường local.
- **Điều rút ra:** Luôn xác minh đăng nhập qua luồng thật của ứng dụng thay vì chỉ tạo user trong database; mật khẩu môi trường local vẫn cần được thay khi triển khai production bằng `npm run create-admin`.

### Lần 11 — Thêm bộ lọc nhóm sản phẩm trong trang admin

- **Ngày:** 05/11/2026.
- **Prompt nguyên văn:**

 > trong danh mục sản phẩm của trang admin tôi muốn thêm lọc nhóm sản phẩm

- **Mục đích:** Lọc danh sách sản phẩm trong workspace quản trị theo nhóm/danh mục, kết hợp được với ô tìm kiếm và bộ lọc trạng thái đã có.
- **Kết quả:** Thêm select `#product-category-filter` (“Tất cả nhóm”) vào thanh công cụ bảng sản phẩm trong `views/partials/admin-workspace.ejs`; trong `public/js/admin.js` thêm hàm `renderProductCategoryFilter()` đổ danh mục từ `/api/admin/lookups` (đánh dấu “(ngừng dùng)” cho nhóm đã tắt, thêm “Chưa phân loại” khi có sản phẩm không có nhóm, giữ lựa chọn cũ khi danh mục thay đổi) và mở rộng `renderProducts()` để lọc theo `category_id`. Bộ lọc kết hợp được với tìm kiếm và lọc trạng thái.
- **Kiểm tra đã thực hiện:** Xác nhận server phục vụ HTML/JS mới; sau khi đăng nhập, select được đổ đủ 14 nhóm và `renderProducts()` chạy không lỗi console.
- **Giới hạn còn lại:** Chưa duyệt chọn từng nhóm trên DOM trong trình duyệt headless (phần tử nằm trong view `hidden` cho tới khi bấm tab “Sản phẩm”), nên việc đếm kết quả theo từng nhóm vẫn cần người dùng xác nhận bằng tay (Ctrl+F5 rồi thử chọn nhóm).
- **Bài học:** Phần tử trong tab chưa mở của SPA quản trị không tương tác được qua công cụ tự động; cần phân biệt “đã đổ dữ liệu/chạy không lỗi” với “đã kiểm tra từng lựa chọn lọc cho ra kết quả đúng”.

### Lần 12 — Cập nhật nhật ký prompt

- **Ngày:** 05/11/2026.
- **Prompt nguyên văn:**

 > update nhật kí promt

- **Mục đích:** Ghi nhận tiếp các lần dùng AI gần nhất (chạy localhost, tài khoản admin, lọc nhóm sản phẩm) vào nhật ký theo đúng khuôn mẫu các lần trước.
- **Kết quả:** Bổ sung lần 9–12 với ngày cụ thể, prompt nguyên văn, kết quả kèm minh chứng (HTTP status, dữ liệu trả về, screenshot đầu ra), phân biệt rõ phần đã kiểm chứng và phần chưa; cập nhật phần tổng kết.
- **Điều rút ra:** Nhật ký nên ghi ngày từ môi trường thực tế và kèm kết quả đo được để tách bạch bằng chứng với suy đoán.

### Lần 13 — Bổ sung session, cookie và dọn dẹp project
- **Ngày:** 12/11/2026.
- **Prompt nguyên văn:**
 > bạn là một chuyên gia developer , đọc qua project của tôi và làm những yêu cầu sau:
 > 1. hiện tại tôi đang còn thiếu session và cookie mà thầy tôi yêu cầu, hãy setup thêm vào project của tôi.
 > 2. clean project xem những cái nào không cần thiết hãy xóa và làm gọn gàng.
- **Mục đích:** Đáp ứng yêu cầu của giảng viên về session/cookie và làm gọn cấu trúc dự án.
- **Kết quả:**
  - Session: tách cấu hình ra `config/session.js` (tên cookie `rideform.sid`, `HttpOnly`, `SameSite=Lax`, `Secure` khi production, hạn 8 giờ, thêm `rolling: true` để tự gia hạn khi còn thao tác, chặn khởi động production nếu thiếu `SESSION_SECRET`); `server.js` dùng `sessionMiddleware`; `authController` dùng chung hằng số/thuộc tính cookie khi `clearCookie`.
  - Cookie: cài `cookie-parser`, thêm cookie giỏ hàng `rideform.cart` (30 ngày) qua `controllers/cartController.js` và `routes/cartRoutes.js` (`GET/PUT/DELETE /api/cart`), đồng bộ từ `public/js/main.js` (lưu khi thêm/xóa, khôi phục khi localStorage trống, xóa sau khi đặt hàng).
  - Cấu hình: thêm `SESSION_SECRET` vào `.env`, ghi chú `npm run gen-secret` trong `.env.example` và `package.json`.
  - Dọn dẹp: xóa `public/admin/index.html` (trang redirect thừa), `phutung_postgresql.sql`, `qkphutung_postgresql.sql` (dump SQL cũ không được dùng), bỏ biến chết `ADMIN_API_KEY` trong `.env`; cập nhật `docs/bao-cao.md`, `docs/huong-dan-cai-dat-va-su-dung.md` và comment trong `database/migrate_qkphutung_to_store.sql`.
- **Kiểm tra đã thực hiện:** Chạy server thật và gọi API: `PUT /api/cart` trả 200 kèm `Set-Cookie: rideform.cart=...; Max-Age=2592000; HttpOnly; SameSite=Lax`, `GET` đọc lại đúng, dữ liệu sai trả 400, `DELETE` trả 204 và xóa cookie; `/api/auth/me` chưa đăng nhập trả 401, login sai trả 401 (không tạo session rác), `/admin/` trả 200; chạy `NODE_ENV=production` thiếu `SESSION_SECRET` báo lỗi đúng.
- **Vấn đề / lưu ý:** `npm install` báo 4 lỗ hổng phụ thuộc (3 moderate, 1 high), chưa chạy `npm audit fix` vì có thể gây breaking change. Session store vẫn là bộ nhớ trong, cần store dùng chung khi chạy nhiều instance.
- **Điều rút ra:** Gom cấu hình session/cookie về một module để tên và thuộc tính cookie không bị lệch giữa lúc tạo và lúc xóa; trước khi xóa file cần grep toàn dự án để chắc chắn không còn tham chiếu.

### Lần 14 — Cấp tài khoản đăng nhập quản trị (local)
- **Ngày:** 12/11/2026.
- **Prompt nguyên văn:**
 > cho tôi tài khoản mật khẩu đăng nhập và update vào nhật kí promt
- **Mục đích:** Có tài khoản admin dùng được ngay để đăng nhập `/admin/` và demo session/cookie cho giảng viên.
- **Kết quả:** Tạo script `scripts/resetAdminLocal.js` (upsert user `admin@rideform.local`, role `admin`, `is_active = TRUE`, mật khẩu hash scrypt qua `lib/password.js`). Tài khoản dùng cho môi trường local:
  - Email: `admin@rideform.local`
  - Mật khẩu: `Rideform@2026`
  - Đăng nhập tại: `http://localhost:3000/admin`
- **Kiểm tra đã thực hiện:** `POST /api/auth/login` → 200 kèm `Set-Cookie: rideform.sid=...; HttpOnly; SameSite=Lax`; `GET /api/auth/me` → 200 trả đúng thông tin admin; `GET /api/admin/summary` → 200 (session hợp lệ qua middleware `requireAdminSession`); `POST /api/auth/logout` → 204 và `GET /api/auth/me` sau đó → 401.
- **Vấn đề / lưu ý:** Đây là mật khẩu môi trường local, **không dùng cho production**. Khi triển khai phải tạo tài khoản riêng bằng `npm run create-admin` với `BOOTSTRAP_ADMIN_*` và mật khẩu mạnh hơn; không đưa mật khẩu thật của production vào nhật ký hay Git.
- **Điều rút ra:** Tách script đặt lại mật khẩu local khỏi script khởi tạo production để tránh vô tình ghi đè tài khoản thật; luôn xác minh bằng luồng đăng nhập thật thay vì chỉ kiểm tra bản ghi trong database.
