BEGIN;

CREATE TABLE IF NOT EXISTS price_lists (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    starts_on DATE,
    ends_on DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT price_lists_date_range_check
        CHECK (starts_on IS NULL OR ends_on IS NULL OR ends_on >= starts_on)
);

CREATE TABLE IF NOT EXISTS price_list_items (
    id BIGSERIAL PRIMARY KEY,
    price_list_id BIGINT NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price NUMERIC(14, 2) NOT NULL CHECK (price > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT price_list_items_product_unique UNIQUE (price_list_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_price_lists_active_dates
    ON price_lists(is_active, starts_on, ends_on);
CREATE INDEX IF NOT EXISTS idx_price_list_items_product
    ON price_list_items(product_id, price_list_id);

INSERT INTO price_list_items (price_list_id, product_id, price)
SELECT pl.id, p.id, p.price
FROM price_lists AS pl
CROSS JOIN products AS p
WHERE pl.is_active = TRUE
  AND (pl.ends_on IS NULL OR pl.ends_on >= CURRENT_DATE)
  AND p.is_active = TRUE AND p.status = 'active'
ON CONFLICT (price_list_id, product_id) DO NOTHING;

COMMIT;
