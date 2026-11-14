-- Copy the converted legacy qkphutung data into the live store schema.
-- Requires the legacy source tables (loaiphutung, nhanhieu, ...) to already exist
-- in the same database; the legacy dump is not shipped with this repository.
-- This migration is safe to rerun: it skips existing categories, brands,
-- products, invoices, opening-stock entries, invoice items, and status events.

BEGIN;

INSERT INTO categories (name, is_active)
SELECT DISTINCT BTRIM(l."TenLoai"), TRUE
FROM "loaiphutung" AS l
WHERE NULLIF(BTRIM(l."TenLoai"), '') IS NOT NULL
ON CONFLICT (name) DO NOTHING;

INSERT INTO brands (name, is_active)
SELECT DISTINCT BTRIM(b."tennhanhieu"), TRUE
FROM "nhanhieu" AS b
WHERE NULLIF(BTRIM(b."tennhanhieu"), '') IS NOT NULL
ON CONFLICT (name) DO NOTHING;

INSERT INTO suppliers (name, email, phone, address, is_active)
SELECT DISTINCT BTRIM(s."TenNCC"), s."Email", s."SoDienThoai", s."DiaChi", TRUE
FROM "nhacungcap" AS s
WHERE NULLIF(BTRIM(s."TenNCC"), '') IS NOT NULL
ON CONFLICT (name) DO UPDATE SET
    email = COALESCE(suppliers.email, EXCLUDED.email),
    phone = COALESCE(suppliers.phone, EXCLUDED.phone),
    address = COALESCE(suppliers.address, EXCLUDED.address);

INSERT INTO products (
    category_id, brand_id, supplier_id, name, sku, price, cost_price,
    stock_quantity, status, is_active, image_url, description, created_at
)
SELECT
    c.id,
    b.id,
    s.id,
    COALESCE(NULLIF(BTRIM(p."TenPhuTung"), ''), p."MaPhuTung"),
    p."MaPhuTung",
    GREATEST(COALESCE(p."GiaLe", p."GiaBanBuon", 0), 0),
    CASE WHEN p."GiaNhap" >= 0 THEN p."GiaNhap" ELSE NULL END,
    GREATEST(COALESCE(p."SoLuongTon", 0), 0),
    CASE WHEN COALESCE(p."ChoPhepBan", 1) = 1 THEN 'active' ELSE 'discontinued' END,
    COALESCE(p."ChoPhepBan", 1) = 1,
    p."HinhAnh",
    p."MoTa",
    COALESCE(p."ngaytao"::timestamp AT TIME ZONE 'UTC', NOW())
FROM "phutung" AS p
LEFT JOIN "loaiphutung" AS l ON l."MaLoai" = p."MaLoai"
LEFT JOIN categories AS c ON c.name = BTRIM(l."TenLoai")
LEFT JOIN "nhanhieu" AS old_brand ON old_brand."manhanhieu" = p."nhanhieu_id"
LEFT JOIN brands AS b ON b.name = BTRIM(old_brand."tennhanhieu")
LEFT JOIN "nhacungcap" AS old_supplier ON old_supplier."mancc" = p."nhanhang_id"
LEFT JOIN suppliers AS s ON s.name = BTRIM(old_supplier."TenNCC")
ON CONFLICT (sku) DO NOTHING;

-- The live product schema forbids negative stock; original values remain in
-- the retained source table "phutung" while the live catalog uses zero.
INSERT INTO inventory_transactions (
    product_id, product_name, sku, movement_type,
    quantity_before, quantity_change, quantity_after,
    reference_type, note, created_at
)
SELECT
    live.id,
    live.name,
    live.sku,
    'opening',
    0,
    live.stock_quantity,
    live.stock_quantity,
    'legacy_import',
    'Imported opening stock; legacy quantity=' || COALESCE(old."SoLuongTon"::text, '0'),
    live.created_at
FROM "phutung" AS old
JOIN products AS live ON live.sku = old."MaPhuTung"
WHERE NOT EXISTS (
    SELECT 1 FROM inventory_transactions AS it
    WHERE it.product_id = live.id AND it.reference_type = 'legacy_import'
);

INSERT INTO invoices (
    invoice_code, customer_name, customer_email, customer_phone,
    subtotal, discount_amount, tax_amount, shipping_fee, total_amount,
    status, payment_status, shipping_address, notes, issued_at, created_at, updated_at
)
SELECT
    old_order."MaDonHang",
    COALESCE(NULLIF(BTRIM(customer."HoTen"), ''), 'Khách lẻ'),
    customer."Email",
    customer."SoDienThoai",
    GREATEST(COALESCE(old_order."TongTien", 0), 0),
    0,
    0,
    0,
    GREATEST(COALESCE(old_order."TongTien", 0), 0),
    CASE BTRIM(COALESCE(old_order."TrangThai", ''))
        WHEN 'Đã hủy' THEN 'cancelled'
        WHEN 'Đang giao hàng' THEN 'shipped'
        WHEN 'Đã giao hàng' THEN 'delivered'
        ELSE 'pending'
    END,
    'pending',
    COALESCE(old_order."DiaChiGiaoHang", ''),
    NULLIF(old_order."GhiChu", ''),
    old_order."NgayDatHang" AT TIME ZONE 'UTC',
    old_order."NgayDatHang" AT TIME ZONE 'UTC',
    old_order."NgayDatHang" AT TIME ZONE 'UTC'
FROM "donhang" AS old_order
LEFT JOIN "khachhang" AS customer ON customer."MaKH" = old_order."MaKH"
ON CONFLICT (invoice_code) DO NOTHING;

INSERT INTO invoice_items (
    invoice_id, product_id, product_name, sku, quantity, unit_price,
    discount_amount, line_total, created_at
)
SELECT
    live_invoice.id,
    live_product.id,
    COALESCE(live_product.name, old_item."MaPhuTung"),
    old_item."MaPhuTung",
    GREATEST(COALESCE(old_item."SoLuong", 1), 1),
    GREATEST(COALESCE(old_item."DonGia", 0), 0),
    LEAST(
        GREATEST(COALESCE(old_item."GiamGia", 0), 0),
        GREATEST(COALESCE(old_item."SoLuong", 1), 1) * GREATEST(COALESCE(old_item."DonGia", 0), 0)
    ),
    GREATEST(
        GREATEST(COALESCE(old_item."SoLuong", 1), 1) * GREATEST(COALESCE(old_item."DonGia", 0), 0)
        - GREATEST(COALESCE(old_item."GiamGia", 0), 0),
        0
    ),
    live_invoice.created_at
FROM "chitietdonhang" AS old_item
JOIN invoices AS live_invoice ON live_invoice.invoice_code = old_item."MaDonHang"
LEFT JOIN products AS live_product ON live_product.sku = old_item."MaPhuTung"
WHERE NOT EXISTS (
    SELECT 1 FROM invoice_items AS current_item
    WHERE current_item.invoice_id = live_invoice.id
      AND current_item.sku = old_item."MaPhuTung"
);

INSERT INTO invoice_status_history (invoice_id, old_status, new_status, note, created_at)
SELECT
    live_invoice.id,
    NULL,
    live_invoice.status,
    'Imported from legacy qkphutung dump',
    live_invoice.created_at
FROM invoices AS live_invoice
JOIN "donhang" AS old_order ON old_order."MaDonHang" = live_invoice.invoice_code
WHERE NOT EXISTS (
    SELECT 1 FROM invoice_status_history AS history
    WHERE history.invoice_id = live_invoice.id
      AND history.note = 'Imported from legacy qkphutung dump'
);

COMMIT;
