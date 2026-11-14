# BÁO CÁO ĐỒ ÁN WEBSITE PHỤ TÙNG XE MÁY
## Bản dự thảo đối chiếu yêu cầu giảng viên

> Trạng thái: bản thảo dựa trên source hiện tại và checklist trong ảnh. Các mục trong ngoặc vuông cần nhóm điền hoặc chụp minh chứng. Báo cáo phân biệt rõ chức năng đã có và yêu cầu còn thiếu, không mô tả tính năng chưa triển khai như thể đã hoàn thành.

## Thông tin đề tài

- **Tên đề tài:** Xây dựng website cửa hàng phụ tùng xe máy RIDEFORM
- **Lớp:** [Điền lớp]
- **Giảng viên:** [Điền tên]
- **Nhóm:** [Điền tên/mã nhóm]
- **Ngày báo cáo:** [Điền ngày]

## Phân bổ trang dự kiến

| Phần | Nội dung | Số trang theo đề cương |
|---|---|---:|
| 0 | Trang bìa, mục lục, phân công | 2 |
| 1 | Giới thiệu đề tài | 2–5 |
| 2 | Đặc tả yêu cầu | 3–6 |
| 3 | Thiết kế hệ thống | 3–6 |
| 4 | Thiết kế cơ sở dữ liệu | 3–4 |
| 5 | Hiện thực và giao diện | 6–8 |
| 6 | Nhật ký làm việc với AI | 2–3 |
| 7 | Kết luận và hướng phát triển | 1–2 |

Số trang thực tế phụ thuộc mẫu trình bày của môn học. Có thể dùng bảng này làm kế hoạch dàn trang trong Word/PDF.

# 0. Trang bìa, mục lục và phân công

## 0.1 Trang bìa

**[Tên trường]**  
**[Tên khoa/bộ môn]**

**BÁO CÁO ĐỒ ÁN MÔN [TÊN MÔN]**

**Đề tài:** Website cửa hàng phụ tùng xe máy RIDEFORM

- Giảng viên hướng dẫn: [Điền tên]
- Nhóm: [Điền mã nhóm]
- Lớp: [Điền lớp]
- Học kỳ/năm học: [Điền]
- Địa điểm, ngày báo cáo: [Điền]

## 0.2 Phân công thành viên

Chưa có tên thành viên và MSSV trong lịch sử trao đổi. Nhóm cần điền đúng người thực hiện; không để nguyên dữ liệu mẫu.

| Thành viên | MSSV | Phần việc phụ trách | Tỷ lệ đóng góp |
|---|---|---|---:|
| [Thành viên 1] | [MSSV] | [Ví dụ: giao diện cửa hàng, responsive] | [%] |
| [Thành viên 2] | [MSSV] | [Ví dụ: API, kiểm soát quyền quản trị] | [%] |
| [Thành viên 3] | [MSSV] | [Ví dụ: PostgreSQL, báo cáo và kiểm thử] | [%] |

Nếu làm cá nhân, thay bảng bằng xác nhận cá nhân theo mẫu của giảng viên.

## 0.3 Mục lục

Tạo mục lục tự động sau khi chuyển báo cáo sang Word/Google Docs, dùng các cấp tiêu đề trong tài liệu này.

# 1. Giới thiệu đề tài

## 1.1 Lý do và mục đích

Website RIDEFORM giới thiệu và bán các sản phẩm phụ tùng xe máy. Người dùng có thể xem sản phẩm, tìm theo tên hoặc mã, lọc danh mục, đưa sản phẩm vào giỏ hàng và gửi đơn hàng theo hình thức thanh toán khi nhận hàng (COD). Nhân viên quản trị có thể theo dõi sản phẩm, tồn kho, bảng giá và hóa đơn.

Mục tiêu của đồ án là thực hành cách tổ chức một ứng dụng web có giao diện phía trình duyệt, API bằng Express và dữ liệu PostgreSQL; áp dụng các thao tác CRUD, truy vấn có tham số, giao dịch cập nhật tồn kho và middleware bảo vệ API quản trị.

## 1.2 Người dùng mục tiêu

- **Người đi xe:** tra cứu phụ tùng, giá và số lượng tồn.
- **Người chơi xe:** tìm sản phẩm phục vụ bảo dưỡng hoặc nâng cấp.
- **Gara/thợ sửa xe:** tham khảo danh mục và gửi nhu cầu mua.
- **Nhân viên quản trị:** quản lý danh mục, sản phẩm, tồn kho, bảng giá, hóa đơn và thanh toán được ghi nhận.

## 1.3 Phạm vi

### Đã có trong source

- Cửa hàng gồm trang chủ, sản phẩm, danh mục, giới thiệu và liên hệ; giỏ hàng lưu trong localStorage.
- API danh sách sản phẩm và checkout COD. Checkout tạo hóa đơn/chi tiết và cập nhật tồn kho trong transaction.
- Khu vực quản trị có đăng nhập admin, session phía máy chủ, đăng xuất và middleware bảo vệ API.
- CRUD sản phẩm, danh mục, thương hiệu, nhà cung cấp, bảng giá và hóa đơn; có thư viện ảnh, nhập/xuất bảng tính.
- Trang quản trị được dựng bằng EJS và tách thành các partial head, form đăng nhập và workspace.

### Ngoài phạm vi hoặc chưa thể xác nhận

- Chưa có đăng nhập khách hàng, đăng ký tài khoản hay thanh toán trực tuyến.
- Biểu mẫu liên hệ mở ứng dụng email của người dùng, không lưu yêu cầu lên backend.
- Chưa triển khai thực tế lên Neon/Render hoặc VPS trong lượt rà soát; chỉ có cấu hình Render Blueprint và workflow GitHub Actions deploy VPS.
- Chưa có ảnh chụp thật, URL triển khai, kết quả kiểm thử nghiệp vụ hay thông tin nhóm được xác minh.

## 1.4 Công nghệ thực tế trong source

| Thành phần | Hiện trạng |
|---|---|
| Runtime/backend | Node.js 18+, Express 4 |
| Database | PostgreSQL, thư viện `pg` và connection pool |
| Frontend cửa hàng | HTML, CSS, JavaScript thuần; giỏ hàng localStorage |
| Frontend quản trị | EJS với partials; CSS và JavaScript thuần |
| Phiên đăng nhập | `express-session`; cookie HttpOnly, session store mặc định trong bộ nhớ |
| Tiện ích | `dotenv`, `cors`, `exceljs` |
| Tự động hóa | GitHub Actions: workflow VPS qua SSH; `render.yaml` là cấu hình blueprint riêng, chưa có bằng chứng deploy |
| Cơ sở dữ liệu đám mây | `config/db.js` hỗ trợ `DATABASE_URL` và TLS; chưa xác nhận kết nối Neon thực tế |

# 2. Đặc tả yêu cầu

## 2.1 Danh sách màn hình

| Đường dẫn | Màn hình | Mục đích |
|---|---|---|
| `/` | Trang chủ | Giới thiệu cửa hàng, CTA, điều hướng và giỏ hàng |
| `/products/` | Sản phẩm | Danh sách, tìm kiếm/lọc và thao tác giỏ hàng |
| `/categories/` | Danh mục | Nhóm sản phẩm theo loại |
| `/about/` | Giới thiệu | Trình bày định hướng cửa hàng |
| `/contact/` | Liên hệ | Thông tin liên hệ và soạn email hỏi hàng |
| `/admin/` | Quản trị | Đăng nhập; sau khi xác thực có dashboard và quản lý dữ liệu |

Các trang cửa hàng là HTML tĩnh trong `public/`. Riêng trang quản trị được render bằng EJS tại `views/admin/index.ejs`, có partials dùng chung.

## 2.2 Chức năng và trạng thái

| Yêu cầu | Trạng thái source | Ghi chú |
|---|---|---|
| Đọc/tìm/lọc sản phẩm, giỏ hàng | Có | API sản phẩm; giỏ lưu ở localStorage |
| Checkout | Có | Chỉ COD; tạo hóa đơn và trừ tồn kho trong transaction |
| Đăng nhập admin | Có | Email/mật khẩu, mật khẩu hash scrypt, tạo session mới khi đăng nhập |
| Đăng xuất/khôi phục session | Có | `POST /api/auth/logout`, `GET /api/auth/me` |
| Gác cổng API quản trị | Có | Middleware yêu cầu `req.session.admin` có role `admin` |
| CRUD sản phẩm/danh mục/bảng giá/hóa đơn | Có | Các API quản trị; một số thao tác xóa là lưu trữ mềm |
| EJS và partials | Có một phần | Áp dụng cho trang quản trị; storefront vẫn dùng HTML tĩnh |
| Giao diện điện thoại | Có CSS responsive | Cần chụp và kiểm tra trực quan trên thiết bị/kích thước thật |
| Đăng nhập khách hàng/thanh toán online | Chưa có | Không được mô tả là chức năng hoàn thành |
| Kiểm thử tự động nghiệp vụ | Chưa có | `npm test` hiện là placeholder |

## 2.3 Yêu cầu phi chức năng

- CORS chỉ phát header cho origin được cấu hình; nếu không cấu hình thì frontend dự kiến chạy cùng origin.
- Cookie session đặt `HttpOnly`, `SameSite=Lax`, thời hạn 8 giờ (tự gia hạn khi còn hoạt động); production bật `Secure` và yêu cầu `SESSION_SECRET`.
- Cookie giỏ hàng `rideform.cart` (30 ngày) chỉ chứa mã sản phẩm và số lượng, không chứa thông tin cá nhân; giỏ vẫn được sao lưu ở localStorage.
- Session store mặc định lưu trong bộ nhớ, phù hợp demo đơn máy; cần store dùng chung khi triển khai nhiều instance và để giữ phiên qua lần khởi động lại.
- Truy vấn sử dụng tham số; luồng checkout dùng transaction để hạn chế ghi dở dang.
- Không đưa mật khẩu, secret hoặc nội dung `.env` vào báo cáo/Git.

# 3. Thiết kế hệ thống

## 3.1 Kiến trúc MVC và cấu trúc

~~~mermaid
flowchart LR
  Browser[Trình duyệt: HTML/CSS/JS] --> Express[Express server]
  Express --> Static[public: storefront tĩnh]
  Express --> View[views: EJS admin + partials]
  Express --> Auth[authRoutes]
  Express --> Product[productRoutes]
  Express --> Admin[adminRoutes]
  Express --> Checkout[checkoutRoutes]
  Auth --> AuthController[authController]
  Admin --> Guard[requireAdminSession]
  Guard --> AdminController[admin controllers]
  Product --> ProductController[productController]
  Checkout --> CheckoutController[checkoutController]
  AuthController --> Pool[pg Pool]
  AdminController --> Pool
  ProductController --> Pool
  CheckoutController --> Pool
  Pool --> DB[(PostgreSQL)]
~~~

Router ánh xạ URL và HTTP method; middleware xác thực session trước API admin; controller xử lý nghiệp vụ; PostgreSQL được truy cập qua `pg` pool. Đây là MVC rút gọn vì một số controller truy vấn trực tiếp, chưa có lớp model riêng.

Cấu trúc liên quan: `server.js`, `config/`, `routes/`, `controllers/`, `middleware/`, `lib/`, `views/admin/`, `views/partials/`, `public/`, `database/`.

## 3.2 Luồng lấy sản phẩm

1. Trình duyệt gửi `GET /api/products`.
2. `productRoutes` gọi `getAllProducts`.
3. Controller truy vấn PostgreSQL qua pool, chọn sản phẩm đang bán và dữ liệu danh mục/giá phù hợp.
4. API trả JSON; JavaScript dựng danh sách sản phẩm trên trang.

## 3.3 Luồng đăng nhập và session admin

1. Người dùng mở `/admin/`; Express render `views/admin/index.ejs`, gồm partial đăng nhập và workspace.
2. Trình duyệt gửi email/mật khẩu bằng `POST /api/auth/login`.
3. `authController` tìm tài khoản admin còn hoạt động, xác minh hash scrypt; khi đúng, gọi `req.session.regenerate()` rồi lưu thông tin admin vào session.
4. Express gửi cookie `rideform.sid` (`HttpOnly`, `SameSite=Lax`, `Secure` khi production, 8 giờ, tự gia hạn); cookie không chứa mật khẩu.
5. Các request `/api/admin/*` đi qua `requireAdminSession`; thiếu session hoặc sai role nhận HTTP 401, hợp lệ thì tới controller.
6. `GET /api/auth/me` khôi phục trạng thái đăng nhập sau khi tải lại trang; `POST /api/auth/logout` hủy session và xóa cookie.
7. Giỏ hàng phía khách được lưu song song ở localStorage và cookie `rideform.cart` qua `GET/PUT/DELETE /api/cart` (cookie-parser đọc, `res.cookie` ghi).

Tài khoản admin được tạo một lần bằng `npm run create-admin` từ các biến `BOOTSTRAP_ADMIN_*`. Không ghi mật khẩu thật vào tài liệu.

## 3.4 Bảng route tiêu biểu

| Phương thức | Đường dẫn | Bảo vệ | Xử lý |
|---|---|---|---|
| GET | `/admin/` | Trang đăng nhập công khai; API vẫn được bảo vệ | Render EJS admin |
| POST | `/api/auth/login` | Công khai, xác minh thông tin | Tạo session admin |
| GET | `/api/auth/me` | Cookie session | Trả trạng thái admin hiện tại |
| POST | `/api/auth/logout` | Cookie session | Hủy session |
| GET | `/api/health` | Công khai | Health check |
| GET | `/api/products` | Công khai | Danh sách sản phẩm |
| POST | `/api/checkout` | Công khai | Đơn COD và cập nhật tồn kho |
| GET/PUT/DELETE | `/api/cart` | Công khai | Đọc/lưu/xóa giỏ hàng trong cookie `rideform.cart` |
| GET/POST | `/api/admin/products` | Session admin | Đọc/tạo sản phẩm |
| PUT/DELETE | `/api/admin/products/:id` | Session admin | Sửa/lưu trữ sản phẩm |
| GET/POST, PUT/DELETE | `/api/admin/catalog/:type[/:id]` | Session admin | CRUD danh mục, thương hiệu, nhà cung cấp |
| GET/POST, PUT/DELETE | `/api/admin/price-lists[/:id]` | Session admin | Quản lý bảng giá |
| GET/POST, PUT/DELETE | `/api/admin/invoices[/:id]` | Session admin | Quản lý hóa đơn |
| POST | `/api/admin/invoices/:id/payments` | Session admin | Ghi nhận khoản thanh toán |
| GET/POST | `/api/admin/images` | Session admin | Đọc/tải ảnh |
| GET/POST | `/api/admin/products/export`, `/import` | Session admin | Xuất/nhập bảng tính |

`routes/adminRoutes.js` gọi `router.use(requireAdminSession)` trước các route nghiệp vụ để bảo vệ toàn router.

# 4. Thiết kế cơ sở dữ liệu

## 4.1 Sơ đồ ER

~~~
erDiagram
  CATEGORIES ||--o{ PRODUCTS : classifies
  BRANDS ||--o{ PRODUCTS : brands
  SUPPLIERS ||--o{ PRODUCTS : supplies
  PRODUCTS ||--o{ PRICE_LIST_ITEMS : priced_in
  PRICE_LISTS ||--o{ PRICE_LIST_ITEMS : contains
  PRODUCTS ||--o{ PRODUCT_IMAGES : has
  PRODUCTS ||--o{ INVENTORY_TRANSACTIONS : changes
  USERS ||--o{ INVENTORY_TRANSACTIONS : records
  USERS ||--o{ INVOICES : places_or_creates
  INVOICES ||--|{ INVOICE_ITEMS : contains
  PRODUCTS ||--o{ INVOICE_ITEMS : sold_as
  INVOICES ||--o{ PAYMENTS : paid_by
  INVOICES ||--o{ INVOICE_STATUS_HISTORY : tracks
  USERS ||--o{ INVOICE_STATUS_HISTORY : changes
  USERS ||--o{ ADMIN_ACTIVITY_LOGS : performs
~~~

Trong `database/init.sql`, các bảng cốt lõi gồm products, categories, users, invoices và invoice_items; các bảng bổ trợ lưu bảng giá, ảnh, tồn kho, thanh toán, trạng thái và hoạt động quản trị. Luồng đăng nhập hiện dùng bảng users cho tài khoản admin; đăng nhập khách hàng chưa được triển khai.

## 4.2 Từ điển dữ liệu tóm tắt

| Bảng | Trường chính và kiểu dữ liệu | Ràng buộc/ý nghĩa |
|---|---|---|
| users | id BIGSERIAL, full_name VARCHAR(200), email VARCHAR(255), password_hash TEXT, phone VARCHAR(30), role VARCHAR(20), is_active BOOLEAN, created_at/updated_at TIMESTAMPTZ | PK; email UNIQUE; role chỉ customer/admin |
| categories | id BIGSERIAL, name VARCHAR(150), slug VARCHAR(180), description TEXT, is_active BOOLEAN, created_at/updated_at TIMESTAMPTZ | PK; name UNIQUE; slug có unique index khi khác NULL |
| brands | id BIGSERIAL, name VARCHAR(150), description TEXT, is_active BOOLEAN, created_at/updated_at TIMESTAMPTZ | PK; name UNIQUE |
| suppliers | id BIGSERIAL, name VARCHAR(200), contact_name VARCHAR(200), email VARCHAR(255), phone VARCHAR(30), address TEXT, notes TEXT, is_active BOOLEAN, created_at/updated_at TIMESTAMPTZ | PK; name UNIQUE |
| products | id BIGSERIAL, category_id/brand_id/supplier_id BIGINT, name VARCHAR(200), sku VARCHAR(80), price/cost_price NUMERIC(14,2), stock_quantity INTEGER, status VARCHAR(20), is_active BOOLEAN, image_url/description TEXT, created_at/updated_at TIMESTAMPTZ | PK; sku UNIQUE; FK tới categories, brands, suppliers; giá và tồn kho không âm; status draft/active/discontinued |
| price_lists | id BIGSERIAL, name VARCHAR(150), description TEXT, starts_on/ends_on DATE, is_active BOOLEAN, created_at/updated_at TIMESTAMPTZ | PK; ngày kết thúc không trước ngày bắt đầu |
| price_list_items | id BIGSERIAL, price_list_id/product_id BIGINT, price NUMERIC(14,2), created_at TIMESTAMPTZ | PK; FK; UNIQUE(price_list_id, product_id); giá > 0 |
| product_images | id BIGSERIAL, product_id BIGINT, image_url TEXT, alt_text VARCHAR(255), is_primary BOOLEAN, sort_order INTEGER, created_at TIMESTAMPTZ | PK; product_id FK; xóa sản phẩm thì xóa ảnh |
| inventory_transactions | id BIGSERIAL, product_id BIGINT, product_name VARCHAR(200), sku VARCHAR(80), movement_type VARCHAR(20), quantity_before/change/after INTEGER, reference_type VARCHAR(30), reference_id BIGINT, note TEXT, created_by BIGINT, created_at TIMESTAMPTZ | PK; FK tới products/users; loại movement có tập giá trị quy định; quantity_after = before + change |
| invoices | id BIGSERIAL, invoice_code VARCHAR(40), user_id BIGINT, customer_name VARCHAR(200), customer_email VARCHAR(255), customer_phone VARCHAR(30), subtotal/discount_amount/tax_amount/shipping_fee/total_amount NUMERIC(14,2), status/payment_status VARCHAR, billing_address/shipping_address/notes TEXT, created_by BIGINT, issued_at/created_at/updated_at TIMESTAMPTZ, deleted_at TIMESTAMPTZ | PK; FK tới users; mã hóa đơn unique index; tiền không âm; trạng thái hóa đơn/thanh toán giới hạn bằng CHECK |
| invoice_items | id BIGSERIAL, invoice_id/product_id BIGINT, product_name VARCHAR(200), sku VARCHAR(80), quantity INTEGER, unit_price/discount_amount/line_total NUMERIC(14,2), created_at TIMESTAMPTZ | PK; FK; quantity > 0; tiền không âm; xóa hóa đơn thì xóa chi tiết |
| payments | id BIGSERIAL, invoice_id BIGINT, amount NUMERIC(14,2), method/status VARCHAR, transaction_code VARCHAR(120), note TEXT, paid_at/created_at TIMESTAMPTZ, created_by BIGINT | PK; FK; amount > 0; phương thức và trạng thái được CHECK |
| invoice_status_history | id BIGSERIAL, invoice_id BIGINT, old_status/new_status VARCHAR(20), note TEXT, changed_by BIGINT, created_at TIMESTAMPTZ | PK; FK tới invoices/users; lưu lịch sử trạng thái |
| admin_activity_logs | id BIGSERIAL, admin_id BIGINT, action VARCHAR(30), entity_type VARCHAR(40), entity_id BIGINT, details JSONB, created_at TIMESTAMPTZ | PK; admin_id FK users; details mặc định JSON rỗng |

## 4.3 Khóa ngoại và chỉ mục

- products.category_id → categories.id; products.brand_id → brands.id; products.supplier_id → suppliers.id. Khi xóa bản ghi danh mục/nhãn hiệu/nhà cung cấp, FK đặt NULL.
- price_list_items tham chiếu price_lists và products; xóa bảng giá/sản phẩm sẽ xóa dòng liên quan.
- invoice_items, payments và invoice_status_history tham chiếu invoices; chi tiết/thanh toán/lịch sử bị xóa cùng hóa đơn.
- invoice_items.product_id, inventory_transactions.product_id và các liên kết user phù hợp dùng SET NULL để giữ lịch sử.
- Các index đáng chú ý: products(category_id), products(brand_id), products(supplier_id), products(is_active,status), invoice_items(invoice_id/product_id), invoices(user_id), invoices(status,created_at DESC), payments(invoice_id), inventory_transactions(product_id,created_at), và các index bảng giá.

## 4.4 Dữ liệu minh họa

Tệp database/seed_demo.sql vừa được bổ sung, chứa danh mục, nhãn hiệu, nhà cung cấp và sản phẩm giả lập với SKU DEMO-CHAIN-01. Không dùng thông tin khách hàng thật. Chạy sau database/init.sql trong database phát triển; nội dung chưa được chạy trên database trong lượt rà soát này.

# 5. Hiện thực và giao diện

## 5.1 Các thành phần mã nguồn

| Thành phần | Tệp tiêu biểu | Vai trò |
|---|---|---|
| Điểm khởi chạy | `server.js` | Cấu hình Express, CORS, JSON, cookie-parser, session, EJS, static files và routes |
| Session & cookie | `config/session.js` | Khóa ký session, tên/thuộc tính cookie dùng chung (`HttpOnly`, `SameSite=Lax`, `Secure` khi production) |
| Kết nối dữ liệu | `config/db.js` | PostgreSQL Pool từ `DATABASE_URL` hoặc `PG*` |
| Định tuyến | `routes/authRoutes.js`, `productRoutes.js`, `adminRoutes.js`, `checkoutRoutes.js`, `cartRoutes.js` | Ghép URL/phương thức với middleware và controller |
| Xác thực | `controllers/authController.js`, `middleware/adminAuth.js`, `lib/password.js` | Đăng nhập, xác minh hash, quản lý session và gác cổng |
| Controller | `controllers/` | Truy vấn sản phẩm và xử lý nghiệp vụ cửa hàng/quản trị |
| Giao diện | `public/`, `views/admin/`, `views/partials/` | Storefront HTML tĩnh; admin EJS có partials |
| CSDL | `database/init.sql` | Tạo/nâng cấp schema, constraint và index |
| Dữ liệu minh họa | `database/seed_demo.sql` | Thêm dữ liệu demo; chưa chạy trong lượt rà soát |

## 5.2 Đoạn mã tiêu biểu

### Đăng ký route sản phẩm

~~~js
router.get('/', getAllProducts);
~~~

Endpoint được mount tại `/api/products`. [Tài liệu định tuyến Express](https://expressjs.com/en/guide/routing/)

### Gác cổng API quản trị

~~~js
function requireAdminSession(req, res, next) {
  if (!req.session?.admin || req.session.admin.role !== 'admin') {
    return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
  }
  return next();
}
~~~

Middleware được áp dụng bằng `router.use(requireAdminSession)` trong `routes/adminRoutes.js`. Session được cấu hình bởi `express-session`; cần dùng session store bền vững khi đưa lên môi trường nhiều instance. [Tài liệu express-session](https://expressjs.com/en/resources/middleware/session/)

### Xác minh mật khẩu

~~~js
const actualKey = await scrypt(password, salt, KEY_LENGTH);
return crypto.timingSafeEqual(actualKey, expectedKey);
~~~

Mật khẩu không được lưu dạng rõ. Công cụ `scripts/createAdmin.js` tạo hash scrypt cho tài khoản quản trị ban đầu.

### Giao dịch checkout và constraint

Checkout mở transaction, khóa dòng sản phẩm để kiểm tra tồn kho, ghi hóa đơn/chi tiết và giảm số lượng; lỗi trước commit sẽ rollback. Schema còn dùng `CHECK`, khóa ngoại và unique index để duy trì toàn vẹn dữ liệu.

~~~sql
price NUMERIC(14, 2) NOT NULL CHECK (price >= 0),
stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
sku VARCHAR(80) NOT NULL UNIQUE
~~~

[Tài liệu PostgreSQL về constraints](https://www.postgresql.org/docs/current/ddl-constraints/).

## 5.3 Ảnh giao diện cần nhóm tự chụp

Chưa có ảnh chụp trình duyệt thật trong tài liệu. Chụp từ ứng dụng đang chạy, không dùng mockup thay minh chứng. Gợi ý thứ tự:

1. Trang chủ desktop: chú thích hero, CTA và điều hướng.
2. Trang sản phẩm: chú thích tìm kiếm, bộ lọc, card sản phẩm và giỏ hàng.
3. Trang danh mục.
4. Trang giới thiệu và liên hệ.
5. Trang đăng nhập admin trước khi đăng nhập.
6. Dashboard admin sau khi đăng nhập.
7. Màn hình thao tác CRUD sản phẩm sau khi kiểm tra trên database demo.
8. Checkout COD và phản hồi kết quả sau khi chạy thử.
9. Trang chủ và sản phẩm trên kích thước điện thoại.

Mỗi ảnh cần chú thích ngắn và ghi kích thước/thiết bị. Che email cá nhân, dữ liệu nhạy cảm và thông tin xác thực.

## 5.4 Hướng dẫn chạy để lấy ảnh

1. Cài Node.js và PostgreSQL.
2. Sao chép `.env.example` thành `.env`, điền cấu hình database và `SESSION_SECRET` cho môi trường triển khai.
3. Chạy `npm install`.
4. Chạy `database/init.sql`; trong môi trường phát triển có thể chạy tiếp `database/seed_demo.sql`.
5. Tạo tài khoản admin bằng cách đặt `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` trong môi trường shell (mật khẩu tối thiểu 12 ký tự), sau đó chạy `npm run create-admin`. Xóa các biến bootstrap sau khi tạo.
6. Chạy `npm start`, mở `http://localhost:3000` và chụp màn hình.
7. Ghi lại kết quả chạy thực tế; không dùng ảnh lỗi làm minh chứng tính năng thành công.

## 5.5 Đối chiếu triển khai

`.github/workflows/deploy.yml` chạy khi push nhánh `main`, cài dependency, chạy `npm test` hiện là placeholder và deploy VPS qua SSH bằng GitHub secrets. `render.yaml` mô tả một Render Blueprint với health check và biến môi trường, nhưng chưa chứng minh dịch vụ đã được tạo/chạy. `config/db.js` hỗ trợ `DATABASE_URL`/TLS; chưa xác nhận database Neon thực tế. [GitHub Actions workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax), [Render Blueprint spec](https://render.com/docs/blueprint-spec).

# 6. Nhật ký làm việc với AI

Nhật ký theo từng yêu cầu, đầu ra, lỗi và cách xử lý được ghi trong [`docs/nhat-ky-prompt.md`](nhat-ky-prompt.md). Khi nộp, nhóm cần đối chiếu lại nội dung nhật ký với lịch sử làm việc thực tế và bổ sung xác nhận của thành viên.

## 6.1 Sai sót và cách sửa trong quá trình chuẩn bị báo cáo

Bản báo cáo ban đầu được tạo sau khi đối chiếu ảnh rubric nhưng sau khi bổ sung đăng nhập/session và EJS partials, nhiều đoạn trong báo cáo vẫn ghi các chức năng này chưa tồn tại. Đây là lỗi đồng bộ tài liệu của AI. Lỗi được phát hiện bằng cách tìm lại các cụm “chưa có đăng nhập”, “ADMIN_API_KEY” và “chưa có EJS” trong báo cáo, rồi đối chiếu với `server.js`, `routes/`, `middleware/`, `views/` và `public/js/admin.js`. Báo cáo đã được cập nhật để mô tả đúng trạng thái mới; phần storefront vẫn là HTML tĩnh, login hiện chỉ dành cho admin.

Trong lượt rà soát này còn phát hiện JavaScript quản trị gọi `AUTH_ROOT` nhưng thiếu khai báo. Đã thêm hằng `/api/auth`; đây là lỗi tích hợp cần nhóm xác nhận lại bằng thao tác đăng nhập trên môi trường có database.

## 6.2 Bài học

- Đọc rubric và kiểm tra source ở thời điểm chốt báo cáo; cập nhật cả tài liệu khi chức năng đổi.
- Không suy luận chức năng từ tên bảng hoặc form; theo luồng từ browser qua route/middleware/controller tới database.
- Ghi rõ khác biệt giữa storefront tĩnh và admin EJS, cũng như giới hạn session store trong bộ nhớ.
- Không tự tạo tên/MSSV, ảnh, kết quả test hay trạng thái deploy; nhóm phải cung cấp và xác minh các minh chứng đó.

# 7. Kết luận và hướng phát triển

## 7.1 Kết quả đạt được trong source

Dự án có storefront HTML/CSS/JavaScript, API sản phẩm, checkout COD có transaction, schema PostgreSQL và khu vực quản trị có đăng nhập admin với session. Các API quản trị có CRUD cho dữ liệu cửa hàng và được bảo vệ qua middleware. Giao diện quản trị dùng EJS partials; GitHub Actions có workflow deploy VPS và có thêm tệp Render Blueprint chưa triển khai.

## 7.2 Giới hạn hiện tại

1. Chưa có đăng nhập/đăng ký khách hàng; authentication chỉ dành cho admin.
2. `express-session` đang dùng MemoryStore mặc định; phiên có thể mất khi restart và không phù hợp nhiều instance.
3. Thanh toán online chưa tích hợp; checkout cửa hàng chỉ COD.
4. `npm test` là placeholder; chưa chạy kiểm thử hoặc nghiệm thu thủ công trong lượt cập nhật này.
5. Chưa có ảnh giao diện thật, thông tin nhóm/MSSV, URL triển khai hay kết quả Neon/Render được xác minh.
6. Liên hệ chưa gửi dữ liệu về backend; form mở ứng dụng email.

## 7.3 Hướng phát triển

- Thêm session store PostgreSQL/Redis, giới hạn tần suất đăng nhập và quy trình đổi mật khẩu.
- Bổ sung đăng nhập khách hàng, lịch sử đơn và thanh toán trực tuyến theo yêu cầu.
- Viết kiểm thử API/checkout, chạy trên database demo và lưu kết quả xác minh.
- Hoàn tất triển khai Render/Neon hoặc VPS, lưu cấu hình nhạy cảm trong secrets và ghi URL thực tế.
- Chụp ảnh desktop/mobile và hoàn thiện trang bìa, phân công, mục lục cùng số trang theo mẫu môn học.

## Tài liệu tham khảo

1. Source dự án: `server.js`, `routes/`, `controllers/`, `middleware/`, `views/`, `config/db.js`, `database/init.sql` và `public/`.
2. Node.js Learn — Introduction to Node.js: https://nodejs.org/learn/getting-started/introduction-to-nodejs
3. Express.js — Routing: https://expressjs.com/en/guide/routing/
4. Express.js — Using middleware: https://expressjs.com/en/guide/using-middleware/
5. EJS — Embedded JavaScript templates: https://github.com/mde/ejs
6. express-session — Session middleware: https://expressjs.com/en/resources/middleware/session/
7. node-postgres — Connecting: https://node-postgres.com/features/connecting
8. PostgreSQL — Constraints: https://www.postgresql.org/docs/current/ddl-constraints.html
9. GitHub Docs — Workflow syntax for GitHub Actions: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
10. Render — Blueprint specification: https://render.com/docs/blueprint-spec

## Checklist hoàn tất trước khi nộp

- [ ] Điền trường/khoa, môn học, giảng viên, nhóm, tên và MSSV.
- [ ] Xác nhận login admin, EJS partials và yêu cầu triển khai trên môi trường thực tế theo rubric.
- [ ] Chụp ảnh tất cả màn hình theo mục 5.3 từ ứng dụng đang chạy.
- [ ] Kiểm tra đăng nhập, session, CRUD, checkout và responsive; ghi kết quả thật (npm test hiện là placeholder).
- [ ] Xác nhận database, môi trường deploy (Neon/Render hoặc VPS) và URL trình diễn.
- [ ] Xuất Word/PDF, cập nhật mục lục và kiểm tra số trang.
- [ ] Xóa dữ liệu cá nhân/secret khỏi ảnh; không nộp .env.
