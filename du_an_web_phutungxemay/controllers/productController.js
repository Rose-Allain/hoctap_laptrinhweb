const pool = require('../config/db');

async function getAllProducts(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT
        p.id,
        p.category_id,
        c.name AS category_name,
        p.name,
        p.sku,
        COALESCE(offer.price, p.price) AS price,
        p.price AS base_price,
        offer.name AS promotion_name,
        p.stock_quantity,
        p.image_url,
        p.description
      FROM products AS p
      LEFT JOIN categories AS c ON c.id = p.category_id
      LEFT JOIN LATERAL (
        SELECT pli.price, pl.name
        FROM price_list_items AS pli
        JOIN price_lists AS pl ON pl.id = pli.price_list_id
        WHERE pli.product_id = p.id AND pl.is_active = TRUE
          AND (pl.starts_on IS NULL OR pl.starts_on <= CURRENT_DATE)
          AND (pl.ends_on IS NULL OR pl.ends_on >= CURRENT_DATE)
        ORDER BY pli.price ASC, pl.updated_at DESC, pl.id DESC
        LIMIT 1
      ) AS offer ON TRUE
      WHERE p.is_active = TRUE AND p.status = 'active'
      ORDER BY p.id DESC
    `);

    res.json({ data: rows });
  } catch (error) {
    console.error('Không thể lấy danh sách sản phẩm:', error);
    res.status(500).json({ message: 'Không thể tải danh sách sản phẩm.' });
  }
}

module.exports = { getAllProducts };
