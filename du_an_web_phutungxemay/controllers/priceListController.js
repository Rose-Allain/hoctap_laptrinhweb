const pool = require('../config/db');

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function validId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) throw httpError(400, 'Mã bảng giá không hợp lệ.');
  return id;
}

function dateValue(value, label, required = false) {
  const text = String(value ?? '').trim();
  if (!text) {
    if (required) throw httpError(400, `Vui lòng chọn ${label}.`);
    return null;
  }
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(text) ? new Date(`${text}T00:00:00.000Z`) : null;
  if (!parsed || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== text) {
    throw httpError(400, `${label} không hợp lệ.`);
  }
  return text;
}

function parsePayload(body) {
  const name = String(body.name ?? '').trim();
  if (!name) throw httpError(400, 'Vui lòng nhập tên bảng giá.');
  if (name.length > 150) throw httpError(400, 'Tên bảng giá không được dài quá 150 ký tự.');
  const description = String(body.description ?? '').trim();
  if (description.length > 10000) throw httpError(400, 'Mô tả không được dài quá 10000 ký tự.');
  const startsOn = dateValue(body.starts_on, 'ngày bắt đầu', true);
  const endsOn = dateValue(body.ends_on, 'ngày kết thúc');
  if (endsOn && endsOn < startsOn) throw httpError(400, 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.');
  if (!Array.isArray(body.items)) throw httpError(400, 'Danh sách giá sản phẩm không hợp lệ.');
  if (body.items.length > 1000) throw httpError(400, 'Mỗi bảng giá chỉ hỗ trợ tối đa 1000 sản phẩm.');

  const seen = new Set();
  const items = body.items.map((item) => {
    const productId = Number(item.product_id);
    const price = Number(item.price);
    if (!Number.isSafeInteger(productId) || productId <= 0) throw httpError(400, 'Sản phẩm trong bảng giá không hợp lệ.');
    if (seen.has(productId)) throw httpError(400, 'Một sản phẩm chỉ được xuất hiện một lần trong bảng giá.');
    seen.add(productId);
    if (!Number.isFinite(price) || price <= 0 || price > 999999999999.99) {
      throw httpError(400, 'Giá ưu đãi phải lớn hơn 0 và nằm trong giới hạn cho phép.');
    }
    return { productId, price: price.toFixed(2) };
  });

  return {
    name,
    description: description || null,
    startsOn,
    endsOn,
    isActive: body.is_active !== false && body.is_active !== 'false',
    items,
  };
}

async function applyToAllActiveProducts(client, submittedItems) {
  const { rows } = await client.query(`
    SELECT id, name, price
    FROM products
    WHERE is_active = TRUE AND status = 'active'
    ORDER BY id
    FOR UPDATE
  `);
  if (rows.length > 1000) throw httpError(400, 'Mỗi bảng giá chỉ hỗ trợ tối đa 1000 sản phẩm đang kinh doanh.');
  const products = new Map(rows.map((product) => [Number(product.id), product]));
  const submitted = new Map(submittedItems.map((item) => [item.productId, item]));
  if ([...submitted.keys()].some((id) => !products.has(id))) {
    throw httpError(400, 'Bảng giá chỉ áp dụng cho sản phẩm đang kinh doanh.');
  }
  return rows.map((product) => {
    const productId = Number(product.id);
    const item = submitted.get(productId);
    const price = item?.price ?? Number(product.price).toFixed(2);
    if (Number(price) > Number(product.price)) {
      throw httpError(400, `Giá trong bảng của “${product.name}” không được cao hơn giá niêm yết.`);
    }
    return { productId, price };
  });
}

async function insertItems(client, listId, items) {
  await client.query(`
    INSERT INTO price_list_items (price_list_id, product_id, price)
    SELECT $1, item.product_id, item.price
    FROM UNNEST($2::bigint[], $3::numeric[]) AS item(product_id, price)
  `, [listId, items.map((item) => item.productId), items.map((item) => item.price)]);
}

async function writeActivity(client, action, listId, name) {
  await client.query(`
    INSERT INTO admin_activity_logs (admin_id, action, entity_type, entity_id, details)
    VALUES (NULL, $1, 'price_list', $2, $3::jsonb)
  `, [action, listId, JSON.stringify({ name })]);
}

async function getPriceLists(_req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT pl.id, pl.name, pl.description, pl.starts_on, pl.ends_on, pl.is_active,
        pl.created_at, pl.updated_at,
        COUNT(pli.id) FILTER (WHERE p.is_active = TRUE AND p.status = 'active')::int AS item_count,
        CASE
          WHEN pl.is_active = FALSE THEN 'inactive'
          WHEN pl.starts_on IS NOT NULL AND pl.starts_on > CURRENT_DATE THEN 'scheduled'
          WHEN pl.ends_on IS NOT NULL AND pl.ends_on < CURRENT_DATE THEN 'expired'
          ELSE 'active'
        END AS effective_status
      FROM price_lists AS pl
      LEFT JOIN price_list_items AS pli ON pli.price_list_id = pl.id
      LEFT JOIN products AS p ON p.id = pli.product_id
      GROUP BY pl.id
      ORDER BY pl.is_active DESC, pl.updated_at DESC, pl.id DESC
    `);
    res.json({ data: rows });
  } catch (error) {
    handleError(res, error);
  }
}

async function getPriceList(req, res) {
  try {
    const id = validId(req.params.id);
    const list = await pool.query('SELECT * FROM price_lists WHERE id = $1', [id]);
    if (!list.rowCount) throw httpError(404, 'Không tìm thấy bảng giá.');
    const items = await pool.query(`
      SELECT pli.product_id, pli.price, p.name, p.sku, p.price AS regular_price,
        p.stock_quantity, c.name AS category_name
      FROM price_list_items AS pli
      JOIN products AS p ON p.id = pli.product_id
      LEFT JOIN categories AS c ON c.id = p.category_id
      WHERE pli.price_list_id = $1
      ORDER BY p.name, p.id
    `, [id]);
    res.json({ data: { ...list.rows[0], items: items.rows } });
  } catch (error) {
    handleError(res, error);
  }
}

async function createPriceList(req, res) {
  try {
    const record = parsePayload(req.body);
    const created = await withTransaction(async (client) => {
      const items = await applyToAllActiveProducts(client, record.items);
      const { rows } = await client.query(`
        INSERT INTO price_lists (name, description, starts_on, ends_on, is_active)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [record.name, record.description, record.startsOn, record.endsOn, record.isActive]);
      await insertItems(client, rows[0].id, items);
      await writeActivity(client, 'create', rows[0].id, rows[0].name);
      return { ...rows[0], item_count: items.length };
    });
    res.status(201).json({ data: created });
  } catch (error) {
    handleError(res, error);
  }
}

async function updatePriceList(req, res) {
  try {
    const id = validId(req.params.id);
    const record = parsePayload(req.body);
    const updated = await withTransaction(async (client) => {
      const current = await client.query('SELECT id FROM price_lists WHERE id = $1 FOR UPDATE', [id]);
      if (!current.rowCount) throw httpError(404, 'Không tìm thấy bảng giá.');
      const items = await applyToAllActiveProducts(client, record.items);
      const { rows } = await client.query(`
        UPDATE price_lists
        SET name = $2, description = $3, starts_on = $4, ends_on = $5, is_active = $6, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [id, record.name, record.description, record.startsOn, record.endsOn, record.isActive]);
      await client.query('DELETE FROM price_list_items WHERE price_list_id = $1', [id]);
      await insertItems(client, id, items);
      await writeActivity(client, 'update', id, rows[0].name);
      return { ...rows[0], item_count: items.length };
    });
    res.json({ data: updated });
  } catch (error) {
    handleError(res, error);
  }
}

async function deletePriceList(req, res) {
  try {
    const id = validId(req.params.id);
    await withTransaction(async (client) => {
      const { rows } = await client.query('DELETE FROM price_lists WHERE id = $1 RETURNING name', [id]);
      if (!rows.length) throw httpError(404, 'Không tìm thấy bảng giá.');
      await writeActivity(client, 'delete', id, rows[0].name);
    });
    res.json({ message: 'Đã xóa bảng giá; hóa đơn cũ vẫn giữ đơn giá tại thời điểm bán.' });
  } catch (error) {
    handleError(res, error);
  }
}

async function withTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function handleError(res, error) {
  if (error.status) return res.status(error.status).json({ message: error.message });
  if (error.code === '23514' || error.code === '22P02' || error.code === '22003') {
    return res.status(400).json({ message: 'Ngày hoặc giá trong bảng giá không hợp lệ.' });
  }
  console.error('Lỗi API bảng giá:', error);
  return res.status(500).json({ message: 'Không thể xử lý bảng giá.' });
}

module.exports = { getPriceLists, getPriceList, createPriceList, updatePriceList, deletePriceList };
