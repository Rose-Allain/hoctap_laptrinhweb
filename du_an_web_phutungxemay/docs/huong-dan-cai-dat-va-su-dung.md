# HƯỚNG DẪN CÀI ĐẶT VÀ SỬ DỤNG

## Website cửa hàng phụ tùng xe máy RIDEFORM

Tài liệu này hướng dẫn cài đặt, cấu hình và vận hành website từ mã nguồn hiện có.

---

## 1. Giới thiệu

RIDEFORM là website thương mại điện tử bán phụ tùng xe máy, gồm:

- **Phía khách hàng:** xem danh mục/sản phẩm, tìm kiếm, giỏ hàng, đặt hàng (checkout), trang giới thiệu/liên hệ.
- **Phía quản trị (`/admin`):** đăng nhập quản trị, quản lý sản phẩm, danh mục, kho ảnh, bảng giá, hóa đơn, xuất Excel.

**Công nghệ sử dụng:**

| Thành phần    | Công nghệ                                                  |
| ------------- | ---------------------------------------------------------- |
| Backend       | Node.js (>= 18), Express                                   |
| View          | EJS template                                               |
| Cơ sở dữ liệu | PostgreSQL                                                 |
| Session       | express-session (cookie `rideform.sid`)                    |
| Cookie        | cookie-parser (cookie giỏ hàng `rideform.cart`)            |
| Xuất Excel    | exceljs                                                    |
| Cấu hình      | dotenv (file `.env`)                                       |
| Triển khai    | Render (xem `render.yaml`, `.github/workflows/deploy.yml`) |

**Cấu trúc thư mục chính:**

```
├── server.js               # Điểm vào ứng dụng Express
├── config/db.js            # Kết nối PostgreSQL (pg Pool)
├── config/session.js       # Cấu hình session + thuộc tính cookie dùng chung
├── controllers/            # auth, product, admin, checkout, cart, priceList, imageLibrary...
├── routes/                 # authRoutes, productRoutes, adminRoutes, checkoutRoutes, cartRoutes
├── middleware/             # adminAuth.js — kiểm tra quyền admin
├── lib/password.js         # Hash mật khẩu
├── views/                  # Template EJS (views/admin, views/partials)
├── public/                 # CSS, JS, ảnh tĩnh; các trang tĩnh (about, contact...)
├── database/
│   ├── init.sql            # Schema chính (idempotent, chạy lại được)
│   ├── price_lists.sql     # Bảng giá
│   └── seed_demo.sql       # Dữ liệu demo
├── scripts/createAdmin.js  # Tạo tài khoản admin đầu tiên
└── docs/                   # Báo cáo, nhật ký, tài liệu
```

---

## 2. Yêu cầu môi trường

Trước khi cài đặt, máy cần có:

1. **Node.js 18 trở lên** — kiểm tra: `node -v`
2. **npm** (đi kèm Node.js) — kiểm tra: `npm -v`
3. **PostgreSQL 13 trở lên** (cài local hoặc dùng dịch vụ đám mây như Neon) — kiểm tra: `psql --version`

---

## 3. Cài đặt

### 3.1. Tải mã nguồn và cài thư viện

Mở terminal tại thư mục dự án, chạy:

```powershell
npm install
```

### 3.2. Tạo cơ sở dữ liệu

Tạo một database rỗng trong PostgreSQL, ví dụ `motorcycle_parts`:

```sql
CREATE DATABASE motorcycle_parts;
```

### 3.3. Cấu hình biến môi trường

Sao chép `.env.example` thành `.env` rồi điền giá trị thực tế:

```powershell
Copy-Item .env.example .env
```

Các biến cần cấu hình:

| Biến                                                     | Ý nghĩa                                                                                |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `PORT`                                                   | Cổng chạy server (mặc định 3000)                                                       |
| `NODE_ENV`                                               | `development` khi dev, `production` khi triển khai                                     |
| `CORS_ORIGIN`                                            | Danh sách origin được phép CORS, phân tách bởi dấu phẩy; bỏ trống để tắt CORS          |
| `DATABASE_URL`                                           | Chuỗi kết nối PostgreSQL (dùng khi host đám mây như Neon/Render)                       |
| `DB_SSL`                                                 | `true` nếu kết nối qua SSL (Neon/Render), `false` khi chạy local                       |
| `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` | Thông số kết nối PostgreSQL local (dùng thay cho `DATABASE_URL`)                       |
| `SESSION_SECRET`                                         | Khóa ký session. **Bắt buộc** khi `NODE_ENV=production`. Tạo bằng `npm run gen-secret` |

> Ưu tiên: nếu có `DATABASE_URL` thì ứng dụng dùng nó; nếu không sẽ dùng nhóm biến `PG*`.

### 3.4. Khởi tạo schema

Chạy file SQL theo thứ tự bằng `psql` (hoặc công cụ như pgAdmin/DBeaver):

```powershell
psql -U postgres -d motorcycle_parts -f database/init.sql
psql -U postgres -d motorcycle_parts -f database/price_lists.sql
psql -U postgres -d motorcycle_parts -f database/seed_demo.sql   # tùy chọn: dữ liệu demo
```

- `init.sql` an toàn để chạy lại (idempotent): nếu dự án cũ còn bảng `orders`/`order_items` thì sẽ được đổi tên thành `invoices`/`invoice_items` mà **không mất dữ liệu**.
- Bỏ qua `seed_demo.sql` nếu chỉ muốn schema rỗng.

### 3.5. Tạo tài khoản quản trị đầu tiên

Đặt các biến môi trường trong phiên terminal hiện tại rồi chạy script (mật khẩu tối thiểu **12 ký tự**):

```powershell
$env:BOOTSTRAP_ADMIN_NAME = "Quản trị viên"
$env:BOOTSTRAP_ADMIN_EMAIL = "admin@example.com"
$env:BOOTSTRAP_ADMIN_PASSWORD = "MatKhauDuManh123!"
npm run create-admin
```

- Script chỉ tạo tài khoản mới; nếu email đã tồn tại nó sẽ báo lỗi và **không** thay đổi tài khoản cũ.
- Sau khi tạo xong, nên xóa các biến môi trường tạm này khỏi phiên làm việc.

### 3.6. Chạy ứng dụng

```powershell
# Chạy thường
npm start

# Hoặc chạy dev, tự khởi động lại khi đổi code
npm run dev
```

Mở trình duyệt tại `http://localhost:3000`. Trang quản trị tại `http://localhost:3000/admin`.

---

## 4. Sử dụng

### 4.1. Phía khách hàng

| Trang               | Đường dẫn        | Chức năng                                        |
| ------------------- | ---------------- | ------------------------------------------------ |
| Trang chủ           | `/`              | Sản phẩm nổi bật, danh mục                       |
| Sản phẩm            | `/products`      | Danh sách, tìm kiếm, lọc, xem chi tiết           |
| Danh mục            | `/categories`    | Duyệt theo nhóm phụ tùng                         |
| Giỏ hàng / Đặt hàng | qua nút trên web | Thêm vào giỏ, điền thông tin, gửi đơn (checkout) |
| Giới thiệu          | `/about`         | Thông tin cửa hàng                               |
| Liên hệ             | `/contact`       | Form liên hệ                                     |

Đơn hàng sau khi đặt được lưu vào bảng `invoices`/`invoice_items` và quản trị viên xử lý ở trang admin.

### 4.2. Phía quản trị (`/admin`)

1. Truy cập `http://localhost:3000/admin`.
2. Đăng nhập bằng tài khoản admin đã tạo ở bước 3.5 (tài khoản có `role = 'admin'`, được kiểm tra bởi middleware `adminAuth`).
3. Các chức năng chính:
   - **Sản phẩm:** thêm/sửa/xóa, tải ảnh lên (ảnh lưu trong `public/images`).
   - **Kho ảnh (image library):** quản lý ảnh dùng chung.
   - **Bảng giá (price lists):** quản lý danh sách giá áp dụng cho sản phẩm.
   - **Hóa đơn:** xem và xử lý đơn hàng của khách.
   - **Xuất Excel:** tải bảng dữ liệu sản phẩm bằng exceljs.

### 4.3. API chính (tóm tắt)

Các route được khai báo trong `routes/`:

- `authRoutes` — đăng nhập, đăng ký, đăng xuất, phiên người dùng.
- `productRoutes` — danh sách/xem chi tiết sản phẩm, danh mục.
- `checkoutRoutes` — tạo đơn hàng.
- `adminRoutes` — các thao tác quản trị (bắt buộc đăng nhập admin).

---

## 5. Triển khai production (Render)

Dự án có sẵn cấu hình:

- `render.yaml` — khai báo dịch vụ Render (Web Service + PostgreSQL).
- `.github/workflows/deploy.yml` — pipeline deploy qua GitHub Actions.

Các bước cơ bản:

1. Đưa mã nguồn lên GitHub.
2. Trên Render, tạo dịch vụ từ `render.yaml` (Blueprint) — Render cấp sẵn `DATABASE_URL`.
3. Trong môi trường của dịch vụ, đặt `SESSION_SECRET` (chuỗi ngẫu nhiên dài, bắt buộc khi production), `NODE_ENV=production`, `DB_SSL=true`.
4. Chạy `database/init.sql` (và `price_lists.sql`) trên database production một lần.
5. Tạo admin đầu tiên bằng `npm run create-admin` với biến `BOOTSTRAP_ADMIN_*`, sau đó xóa biến này đi.
6. Deploy — GitHub Actions sẽ tự chạy khi push.

---

## 6. Xử lý sự cố thường gặp

| Hiện tượng                                                   | Nguyên nhân & cách xử lý                                                                                                |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Không kết nối được database                                  | Kiểm tra `DATABASE_URL` hoặc nhóm `PG*` trong `.env`; với đám mây đặt `DB_SSL=true`                                     |
| Server báo "Cần cấu hình SESSION_SECRET khi chạy production" | Đặt `SESSION_SECRET` trong `.env` khi `NODE_ENV=production`                                                             |
| `npm run create-admin` báo thiếu biến                        | Chưa đặt đủ `BOOTSTRAP_ADMIN_NAME/EMAIL/PASSWORD`; mật khẩu phải ≥ 12 ký tự                                             |
| Báo "Email đã tồn tại" khi tạo admin                         | Email đã có trong bảng `users`; script không ghi đè — dùng email khác hoặc đổi quyền trong DB                           |
| Trang admin không vào được                                   | Chưa đăng nhập bằng tài khoản `role = 'admin'`, hoặc cookie session chưa có (kiểm tra trình duyệt có chặn cookie không) |
| Chạy lại `init.sql` có báo lỗi?                              | Không nên có — script được thiết kế idempotent; nếu lỗi, kiểm tra tên bảng/cột trùng trong schema                       |

---

## 7. Kiểm thử

Hiện tại lệnh kiểm thử là placeholder:

```powershell
npm run test
```

sẽ in thông báo "Chưa cấu hình test tự động (placeholder)." — dự án chưa có bộ test tự động; kiểm thử thực hiện thủ công theo kịch bản ở mục 4.

---

_Tài liệu được soạn dựa trên mã nguồn và cấu hình hiện tại của dự án (tháng 11/2026)._
