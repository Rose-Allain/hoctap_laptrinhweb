-- Dữ liệu minh họa tổng hợp, không lấy từ khách hàng thật.
-- Chạy sau database/init.sql. Các SKU mẫu có tiền tố DEMO-.
BEGIN;

INSERT INTO categories (name, slug, description)
VALUES (
  'Truyền động (minh họa)',
  'truyen-dong-minh-hoa',
  'Danh mục dữ liệu minh họa phục vụ trình diễn và chụp ảnh báo cáo.'
)
ON CONFLICT (name) DO NOTHING;

INSERT INTO brands (name, description)
VALUES (
  'RIDEFORM Demo',
  'Thương hiệu minh họa trong dữ liệu mẫu.'
)
ON CONFLICT (name) DO NOTHING;

INSERT INTO suppliers (name, contact_name, email, phone, address, notes)
VALUES (
  'Nhà cung cấp minh họa',
  'Nhân viên mẫu',
  'demo@example.invalid',
  '0000000000',
  'Địa chỉ minh họa',
  'Dữ liệu giả lập; không dùng để liên hệ hoặc giao dịch.'
)
ON CONFLICT (name) DO NOTHING;

INSERT INTO products (
  category_id, brand_id, supplier_id, name, sku, price, cost_price,
  stock_quantity, status, is_active, image_url, description
)
SELECT
  c.id,
  b.id,
  s.id,
  'Bộ nhông xích (minh họa)',
  'DEMO-CHAIN-01',
  850000,
  600000,
  12,
  'active',
  TRUE,
  NULL,
  'Sản phẩm giả lập dùng để kiểm tra giao diện và luồng quản lý.'
FROM categories AS c
CROSS JOIN brands AS b
CROSS JOIN suppliers AS s
WHERE c.name = 'Truyền động (minh họa)'
  AND b.name = 'RIDEFORM Demo'
  AND s.name = 'Nhà cung cấp minh họa'
ON CONFLICT (sku) DO NOTHING;

COMMIT;
