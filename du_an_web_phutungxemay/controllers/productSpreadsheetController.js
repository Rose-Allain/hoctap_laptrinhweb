const ExcelJS = require('exceljs');
const pool = require('../config/db');
const { parseProduct, withTransaction, adjustStock, syncProductPriceLists, syncPrimaryImage, writeActivity } = require('./adminController');

const MAX_IMPORT_ROWS = 1000;
const HEADERS = [
  { key: 'sku', title: 'SKU', width: 18 },
  { key: 'name', title: 'Tên sản phẩm', width: 34 },
  { key: 'category', title: 'Danh mục', width: 22 },
  { key: 'brand', title: 'Thương hiệu', width: 20 },
  { key: 'supplier', title: 'Nhà cung cấp', width: 22 },
  { key: 'price', title: 'Giá niêm yết (₫)', width: 18 },
  { key: 'cost_price', title: 'Giá nhập (₫)', width: 16 },
  { key: 'stock_quantity', title: 'Tồn kho', width: 12 },
  { key: 'status', title: 'Trạng thái', width: 18 },
  { key: 'is_active', title: 'Hiển thị cửa hàng', width: 19 },
  { key: 'image_url', title: 'URL ảnh', width: 38 },
  { key: 'description', title: 'Mô tả', width: 48 },
];

const HEADER_ALIASES = {
  sku: ['sku', 'ma sku', 'ma san pham'],
  name: ['ten san pham', 'product name', 'name'],
  category: ['danh muc', 'category', 'category name'],
  brand: ['thuong hieu', 'brand', 'brand name'],
  supplier: ['nha cung cap', 'supplier', 'supplier name'],
  price: ['gia niem yet', 'gia ban', 'gia le', 'retail price', 'price'],
  cost_price: ['gia nhap', 'cost price'],
  stock_quantity: ['ton kho', 'so luong ton', 'stock quantity', 'stock'],
  status: ['trang thai', 'status'],
  is_active: ['hien thi cua hang', 'dang ban', 'is active', 'active'],
  image_url: ['url anh', 'anh dai dien', 'image url'],
  description: ['mo ta', 'description'],
};

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalized(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLocaleLowerCase('vi')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function cellValue(cell) {
  const value = cell?.value;
  if (value === null || value === undefined) return '';
  if (value instanceof Date || typeof value !== 'object') return value;
  if (Object.hasOwn(value, 'result')) return value.result ?? '';
  if (Object.hasOwn(value, 'text')) return value.text;
  if (Array.isArray(value.richText)) return value.richText.map((part) => part.text || '').join('');
  return cell.text || '';
}

function cellText(cell) {
  const value = cellValue(cell);
  return value === null || value === undefined ? '' : String(value).trim();
}

function sheetNumber(value, label, nullable = false) {
  if (value === null || value === undefined || String(value).trim() === '') {
    if (nullable) return null;
    throw httpError(400, `Thiếu ${label}.`);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw httpError(400, `${label} không hợp lệ.`);
    return value;
  }
  let text = String(value).trim().replace(/[\s₫đ]/gi, '');
  if (/^\d{1,3}(\.\d{3})+$/.test(text)) text = text.replace(/\./g, '');
  else if (/^\d{1,3}(,\d{3})+$/.test(text)) text = text.replace(/,/g, '');
  else if (text.includes(',') && !text.includes('.')) text = text.replace(',', '.');
  else if (text.includes(',') && text.includes('.')) text = text.replace(/\./g, '').replace(',', '.');
  const number = Number(text);
  if (!Number.isFinite(number)) throw httpError(400, `${label} không hợp lệ.`);
  return number;
}

function sheetBoolean(value, defaultValue = true) {
  if (value === null || value === undefined || String(value).trim() === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  const valueKey = normalized(value);
  if (['0', 'false', 'no', 'khong', 'an', 'ngung', 'inactive'].includes(valueKey)) return false;
  if (['1', 'true', 'yes', 'co', 'dang ban', 'active'].includes(valueKey)) return true;
  throw httpError(400, 'Cột “Hiển thị cửa hàng” chỉ nhận Có/Không hoặc TRUE/FALSE.');
}

function sheetStatus(value) {
  const status = normalized(value);
  if (!status || ['active', 'dang ban', 'dang kinh doanh'].includes(status)) return 'active';
  if (['draft', 'ban nhap'].includes(status)) return 'draft';
  if (['discontinued', 'ngung ban', 'ngung kinh doanh'].includes(status)) return 'discontinued';
  throw httpError(400, 'Trạng thái phải là active, draft hoặc discontinued.');
}

function mapLookup(records) {
  return new Map(records.map((record) => [normalized(record.name), Number(record.id)]));
}

function resolveLookup(value, map, label) {
  const name = String(value ?? '').trim();
  if (!name) return null;
  const id = map.get(normalized(name));
  if (!id) throw httpError(400, `Không tìm thấy ${label} “${name}” trong danh mục.`);
  return id;
}

async function exportProducts(_req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT p.sku, p.name, c.name AS category, b.name AS brand, s.name AS supplier,
        p.price, p.cost_price, p.stock_quantity, p.status, p.is_active,
        p.image_url, p.description
      FROM products AS p
      LEFT JOIN categories AS c ON c.id = p.category_id
      LEFT JOIN brands AS b ON b.id = p.brand_id
      LEFT JOIN suppliers AS s ON s.id = p.supplier_id
      ORDER BY p.name, p.id
    `);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'RIDEFORM';
    workbook.created = new Date();
    const sheet = workbook.addWorksheet('SanPham', { views: [{ state: 'frozen', ySplit: 1 }] });
    sheet.columns = HEADERS.map(({ key, title, width }) => ({ key, header: title, width }));
    for (const product of rows) sheet.addRow(product);
    const header = sheet.getRow(1);
    header.height = 26;
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF25372D' } };
    header.alignment = { vertical: 'middle', wrapText: true };
    sheet.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + HEADERS.length)}${Math.max(1, rows.length + 1)}` };
    sheet.getColumn('sku').numFmt = '@';
    for (const key of ['price', 'cost_price']) sheet.getColumn(key).numFmt = '#,##0.00';
    sheet.getColumn('stock_quantity').numFmt = '0';
    const buffer = await workbook.xlsx.writeBuffer();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': "attachment; filename*=UTF-8''san-pham-rideform.xlsx",
      'Cache-Control': 'no-store',
    });
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Không thể xuất Excel sản phẩm:', error);
    res.status(500).json({ message: 'Không thể xuất danh sách sản phẩm.' });
  }
}

async function importProducts(req, res) {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    return res.status(400).json({ message: 'Hãy chọn một tệp .xlsx để nhập.' });
  }
  try {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(req.body);
    } catch (_error) {
      throw httpError(400, 'Tệp Excel không hợp lệ hoặc không đọc được.');
    }
    const sheet = workbook.getWorksheet('SanPham') || workbook.worksheets[0];
    if (!sheet || sheet.rowCount < 2) throw httpError(400, 'Tệp Excel không có dòng sản phẩm để nhập.');
    if (sheet.rowCount > MAX_IMPORT_ROWS + 20) throw httpError(400, `Tệp Excel vượt quá ${MAX_IMPORT_ROWS} dòng dữ liệu.`);

    const headerIndexes = new Map();
    sheet.getRow(1).eachCell({ includeEmpty: false }, (cell, columnNumber) => {
      headerIndexes.set(normalized(cellText(cell)), columnNumber);
    });
    const columns = {};
    for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
      const match = aliases.map(normalized).find((alias) => headerIndexes.has(alias));
      if (match) columns[key] = headerIndexes.get(match);
    }
    for (const required of ['sku', 'name', 'price']) {
      if (!columns[required]) throw httpError(400, `Tệp cần có cột “${HEADERS.find((header) => header.key === required).title}”.`);
    }

    const [categories, brands, suppliers] = await Promise.all([
      pool.query('SELECT id, name FROM categories'),
      pool.query('SELECT id, name FROM brands'),
      pool.query('SELECT id, name FROM suppliers'),
    ]);
    const lookups = {
      category_id: mapLookup(categories.rows),
      brand_id: mapLookup(brands.rows),
      supplier_id: mapLookup(suppliers.rows),
    };

    const records = [];
    const seenSkus = new Set();
    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
      const row = sheet.getRow(rowNumber);
      const values = Object.fromEntries(Object.entries(columns).map(([key, column]) => [key, cellValue(row.getCell(column))]));
      if (Object.values(values).every((value) => value === null || value === undefined || String(value).trim() === '')) continue;
      if (records.length >= MAX_IMPORT_ROWS) throw httpError(400, `Tệp Excel vượt quá ${MAX_IMPORT_ROWS} dòng dữ liệu.`);
      try {
        const sku = String(values.sku ?? '').trim();
        const skuKey = normalized(sku);
        if (!sku) throw httpError(400, 'Vui lòng nhập SKU.');
        if (seenSkus.has(skuKey)) throw httpError(400, `SKU “${sku}” xuất hiện nhiều lần trong tệp.`);
        seenSkus.add(skuKey);
        const body = {
          name: values.name,
          sku,
          category_id: resolveLookup(values.category, lookups.category_id, 'danh mục'),
          brand_id: resolveLookup(values.brand, lookups.brand_id, 'thương hiệu'),
          supplier_id: resolveLookup(values.supplier, lookups.supplier_id, 'nhà cung cấp'),
          price: sheetNumber(values.price, 'giá niêm yết'),
          cost_price: sheetNumber(values.cost_price, 'giá nhập', true),
          stock_quantity: values.stock_quantity === undefined || String(values.stock_quantity).trim() === ''
            ? 0 : sheetNumber(values.stock_quantity, 'tồn kho'),
          status: sheetStatus(values.status),
          is_active: sheetBoolean(values.is_active),
          image_url: values.image_url,
          description: values.description,
        };
        records.push({ rowNumber, product: parseProduct(body) });
      } catch (error) {
        error.status = error.status || 400;
        error.message = `Dòng ${rowNumber}: ${error.message}`;
        throw error;
      }
    }
    if (!records.length) throw httpError(400, 'Tệp Excel không có dòng sản phẩm để nhập.');

    const counts = await withTransaction(async (client) => {
      let created = 0;
      let updated = 0;
      for (const { product } of records) {
        const currentResult = await client.query('SELECT id, name, sku, stock_quantity FROM products WHERE sku = $1 FOR UPDATE', [product.sku]);
        let saved;
        if (currentResult.rowCount) {
          const current = currentResult.rows[0];
          const { rows } = await client.query(`
            UPDATE products SET category_id = $2, brand_id = $3, supplier_id = $4,
              name = $5, price = $6, cost_price = $7, status = $8, is_active = $9,
              image_url = $10, description = $11, updated_at = NOW()
            WHERE id = $1
            RETURNING id, name, sku, stock_quantity
          `, [current.id, product.categoryId, product.brandId, product.supplierId, product.name,
            product.price, product.costPrice, product.status, product.isActive, product.imageUrl, product.description]);
          saved = rows[0];
          const stockDelta = product.stock - Number(current.stock_quantity);
          if (stockDelta) await adjustStock(client, saved, stockDelta, 'adjustment', 'Điều chỉnh tồn kho từ Excel');
          updated += 1;
        } else {
          const { rows } = await client.query(`
            INSERT INTO products (
              category_id, brand_id, supplier_id, name, sku, price, cost_price,
              stock_quantity, status, is_active, image_url, description
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10, $11)
            RETURNING id, name, sku, stock_quantity
          `, [product.categoryId, product.brandId, product.supplierId, product.name, product.sku,
            product.price, product.costPrice, product.status, product.isActive, product.imageUrl, product.description]);
          saved = rows[0];
          if (product.stock > 0) await adjustStock(client, saved, product.stock, 'opening', 'Tồn kho ban đầu từ Excel');
          created += 1;
        }
        await syncProductPriceLists(client, saved.id, product.price);
        await syncPrimaryImage(client, saved.id, product.imageUrl, product.name);
        await writeActivity(client, currentResult.rowCount ? 'update' : 'create', 'product', saved.id,
          { name: product.name, sku: product.sku, source: 'excel' });
      }
      return { created, updated };
    });
    res.json({ data: { ...counts, total: records.length }, message: `Đã nhập ${records.length} sản phẩm từ Excel.` });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    if (error.code === '23505') return res.status(409).json({ message: 'SKU trong tệp bị trùng với dữ liệu không thể cập nhật.' });
    if (error.code === '23503' || error.code === '23514' || error.code === '22P02' || error.code === '22003') {
      return res.status(400).json({ message: 'Danh mục, giá hoặc tồn kho trong tệp không hợp lệ.' });
    }
    if (error.message?.includes('Parse Error') || error.message?.includes('Invalid')) {
      return res.status(400).json({ message: 'Tệp Excel không hợp lệ hoặc không đọc được.' });
    }
    console.error('Không thể nhập Excel sản phẩm:', error);
    return res.status(500).json({ message: 'Không thể nhập danh sách sản phẩm.' });
  }
}

module.exports = { exportProducts, importProducts };
