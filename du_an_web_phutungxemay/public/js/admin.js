const API_ROOT = '/api/admin';
const AUTH_ROOT = '/api/auth';
const INVOICE_STATUS_LABELS = {
  draft: 'Bản nháp', pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', processing: 'Đang xử lý',
  shipped: 'Đang giao', delivered: 'Đã giao', cancelled: 'Đã hủy', refunded: 'Đã hoàn tiền',
};
const PAYMENT_STATUS_LABELS = { pending: 'Chưa thanh toán', partial: 'Thanh toán một phần', paid: 'Đã thanh toán', refunded: 'Đã hoàn tiền' };
const PAYMENT_METHOD_LABELS = { cash: 'Tiền mặt', bank_transfer: 'Chuyển khoản', card: 'Thẻ', e_wallet: 'Ví điện tử', cod: 'Thu hộ (COD)', other: 'Khác' };

const state = { products: [], invoices: [], priceLists: [], dashboard: null, dashboardPeriod: '24m', lookups: { categories: [], brands: [], suppliers: [] }, catalogType: 'brands', catalogRecords: [], toastTimer: null, reopenInvoiceId: null };
const accessScreen = document.querySelector('#access-screen');
const adminApp = document.querySelector('#admin-app');
const accessForm = document.querySelector('#access-form');
const accessEmailInput = document.querySelector('#admin-email');
const accessPasswordInput = document.querySelector('#admin-password');
const accessError = document.querySelector('#access-error');
const productDialog = document.querySelector('#product-dialog');
const imagePickerDialog = document.querySelector('#image-picker-dialog');
const imagePickerGrid = document.querySelector('#image-picker-grid');
const imagePickerStatus = document.querySelector('#image-picker-status');
const catalogDialog = document.querySelector('#catalog-dialog');
const catalogForm = document.querySelector('#catalog-form');
const catalogListPanel = document.querySelector('#catalog-list-panel');
const catalogList = document.querySelector('#catalog-list');
const catalogEmpty = document.querySelector('#catalog-empty');
const invoiceDialog = document.querySelector('#invoice-dialog');
const paymentDialog = document.querySelector('#payment-dialog');
const productForm = document.querySelector('#product-form');
const invoiceForm = document.querySelector('#invoice-form');
const paymentForm = document.querySelector('#payment-form');
const priceListDialog = document.querySelector('#price-list-dialog');
const priceListForm = document.querySelector('#price-list-form');

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function formatMoney(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
    .format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

function statusPill(status, label, extraClass = '') {
  return `<span class="status-pill status-pill--${escapeHtml(status)} ${extraClass}">${escapeHtml(label)}</span>`;
}

function resolveProductImageUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const raw = value.trim().replace(/\\/g, '/');
    const isExternal = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(raw);
    const relativePath = raw.replace(/^\.\/+/, '');
    const source = isExternal
      ? raw
      : raw.startsWith('/')
        ? raw
        : relativePath.startsWith('public/images/')
          ? `/${relativePath.slice('public/'.length)}`
          : relativePath.startsWith('images/')
            ? `/${relativePath}`
            : `/images/${relativePath}`;
    const parsedUrl = new URL(source, window.location.origin);
    return ['http:', 'https:'].includes(parsedUrl.protocol) ? parsedUrl.href : '';
  } catch (_error) {
    return '';
  }
}

function showToast(message, isError = false) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.toggle('is-error', isError);
  toast.classList.add('is-visible');
  window.clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3300);
}

function showAccessError(message) {
  accessError.textContent = message;
  accessError.hidden = false;
}

function clearAccess() {
  adminApp.hidden = true;
  accessScreen.hidden = false;
  accessPasswordInput.value = '';
  accessEmailInput.focus();
}

async function adminFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (typeof options.body === 'string' && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }
  let response;
  try {
    response = await fetch(`${API_ROOT}${path}`, {
      ...options,
      headers,
      credentials: 'same-origin',
    });
  } catch (_error) {
    throw new Error('Không kết nối được máy chủ. Hãy kiểm tra máy chủ Node.js và PostgreSQL.');
  }
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401) {
    clearAccess();
    throw new Error(payload.message || 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
  }
  if (!response.ok) throw new Error(payload.message || 'Yêu cầu không thành công.');
  return payload;
}

async function connectToAdmin() {
  accessError.hidden = true;
  try {
    const response = await fetch(AUTH_ROOT + '/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        email: accessEmailInput.value.trim(),
        password: accessPasswordInput.value,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || 'Không thể đăng nhập.');
    accessScreen.hidden = true;
    adminApp.hidden = false;
    accessPasswordInput.value = '';
    await loadAll();
  } catch (error) {
    clearAccess();
    showAccessError(error.message);
  }
}

async function restoreAdminSession() {
  try {
    const response = await fetch(AUTH_ROOT + '/me', { credentials: 'same-origin' });
    if (!response.ok) {
      accessEmailInput.focus();
      return;
    }
    accessScreen.hidden = true;
    adminApp.hidden = false;
    await loadAll();
  } catch (_error) {
    accessEmailInput.focus();
  }
}

async function logoutAdmin() {
  try {
    await fetch(AUTH_ROOT + '/logout', { method: 'POST', credentials: 'same-origin' });
  } finally {
    clearAccess();
  }
}

async function loadAll() {
  try {
    const [summary, dashboard, products, invoices, lookups, priceLists] = await Promise.all([
      adminFetch('/summary'), adminFetch(`/dashboard?period=${state.dashboardPeriod}`),
      adminFetch('/products'), adminFetch('/invoices'), adminFetch('/lookups'), adminFetch('/price-lists'),
    ]);
    state.products = products.data || [];
    state.invoices = invoices.data || [];
    state.priceLists = priceLists.data || [];
    state.dashboard = dashboard;
    state.lookups = lookups;
    renderSummary(summary);
    renderDashboard(dashboard);
    renderProducts();
    renderInvoices();
    renderPriceLists();
    renderOverview();
    populateLookupSelects();
    setTodayLabel();
  } catch (error) {
    showToast(error.message, true);
  }
}

function setTodayLabel() {
  const now = new Date();
  document.querySelector('#today-label').textContent = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short', day: '2-digit', month: 'long', year: 'numeric',
  }).format(now);
  const eyebrow = document.querySelector('#view-overview .view-heading .admin-eyebrow');
  eyebrow.textContent = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    .format(now).toUpperCase();
}

function renderSummary(summary) {
  document.querySelector('#metric-products').textContent = Number(summary.products.total || 0).toLocaleString('vi-VN');
  document.querySelector('#metric-active-products').textContent = `${Number(summary.products.active || 0).toLocaleString('vi-VN')} sản phẩm đang bán`;
  document.querySelector('#metric-invoices').textContent = Number(summary.invoices || 0).toLocaleString('vi-VN');
  document.querySelector('#metric-revenue').textContent = formatMoney(summary.revenue);
  document.querySelector('#metric-month-revenue').textContent = formatMoney(summary.monthRevenue);
  document.querySelector('#metric-stock-value').textContent = formatMoney(summary.inventoryValue);
  document.querySelector('#metric-low-stock').textContent = Number(summary.lowStock || 0).toLocaleString('vi-VN');
}

function renderDashboard(dashboard) {
  const trends = dashboard.salesTrend || [];
  const totalRevenue = trends.reduce((sum, row) => sum + Number(row.revenue || 0), 0);
  const totalInvoices = trends.reduce((sum, row) => sum + Number(row.invoices || 0), 0);
  const maximum = Math.max(1, ...trends.map((row) => Number(row.revenue || 0)));
  document.querySelector('#dashboard-sales-total').textContent = `${formatMoney(totalRevenue)} · ${totalInvoices.toLocaleString('vi-VN')} hóa đơn trong kỳ`;
  document.querySelector('#dashboard-sales-empty').hidden = totalInvoices > 0;
  document.querySelector('#dashboard-sales-chart').innerHTML = trends.map((row) => {
    const revenue = Number(row.revenue) || 0;
    const height = revenue ? Math.max(5, (revenue / maximum) * 100) : 2;
    return `<div class="sales-chart__column" title="${escapeHtml(row.label)} · ${formatMoney(revenue)} · ${Number(row.invoices) || 0} hóa đơn"><div class="sales-chart__bar"><span style="height:${height}%"></span></div><small>${escapeHtml(row.label)}</small></div>`;
  }).join('');

  const bestSellers = dashboard.topProducts || [];
  document.querySelector('#dashboard-top-empty').hidden = bestSellers.length > 0;
  document.querySelector('#dashboard-top-products').innerHTML = bestSellers.map((product, index) => `
    <div class="dashboard-rank-row"><span class="dashboard-rank-number">${String(index + 1).padStart(2, '0')}</span><div class="dashboard-rank-row__name"><strong>${escapeHtml(product.name || 'Sản phẩm')}</strong><small>${escapeHtml(product.sku || '—')}</small></div><div class="dashboard-rank-row__value"><strong>${Number(product.units_sold || 0).toLocaleString('vi-VN')} món</strong><small>${formatMoney(product.revenue)}</small></div></div>`).join('');

  const categories = dashboard.stockByCategory || [];
  const maxStock = Math.max(1, ...categories.map((item) => Number(item.stock || 0)));
  document.querySelector('#dashboard-stock-empty').hidden = categories.length > 0;
  document.querySelector('#dashboard-stock-categories').innerHTML = categories.map((item) => {
    const width = Number(item.stock) ? Math.max(3, (Number(item.stock) / maxStock) * 100) : 0;
    return `<div class="dashboard-stock-row"><div><strong>${escapeHtml(item.name)}</strong><small>${Number(item.products || 0).toLocaleString('vi-VN')} sản phẩm · ${formatMoney(item.value)}</small></div><span class="dashboard-stock-track"><i style="width:${width}%"></i></span><b>${Number(item.stock || 0).toLocaleString('vi-VN')}</b></div>`;
  }).join('');

  const statusLabels = { draft: 'Bản nháp', pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', processing: 'Đang xử lý', shipped: 'Đang giao', delivered: 'Đã giao', cancelled: 'Đã hủy', refunded: 'Đã hoàn tiền' };
  const statuses = dashboard.invoiceStatuses || [];
  document.querySelector('#dashboard-status-empty').hidden = statuses.length > 0;
  document.querySelector('#dashboard-invoice-statuses').innerHTML = statuses.map((item) => `
    <div class="dashboard-status-row">${statusPill(item.status, statusLabels[item.status] || item.status)}<strong>${Number(item.total || 0).toLocaleString('vi-VN')}</strong></div>`).join('');
}

async function refreshDashboard(period = state.dashboardPeriod) {
  const previousPeriod = state.dashboardPeriod;
  state.dashboardPeriod = period;
  try {
    const dashboard = await adminFetch(`/dashboard?period=${encodeURIComponent(period)}`);
    state.dashboard = dashboard;
    renderDashboard(dashboard);
  } catch (error) {
    state.dashboardPeriod = previousPeriod;
    document.querySelector('#dashboard-period').value = previousPeriod;
    showToast(error.message, true);
  }
}

async function downloadProductsExcel() {
  const button = document.querySelector('#product-export-button');
  button.disabled = true;
  try {
    const response = await fetch(`${API_ROOT}/products/export`, { credentials: 'same-origin' });
    if (response.status === 401) {
      const payload = await response.json().catch(() => ({}));
      clearAccess();
      throw new Error(payload.message || 'Khóa quản trị không hợp lệ.');
    }
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message || 'Không thể xuất danh sách sản phẩm.');
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'san-pham-rideform.xlsx';
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Đã xuất danh sách sản phẩm ra Excel.');
  } catch (error) {
    showToast(error.message, true);
  } finally {
    button.disabled = false;
  }
}

async function importProductsExcel(file) {
  const input = document.querySelector('#product-import-file');
  if (!file) return;
  if (!file.name.toLocaleLowerCase('vi').endsWith('.xlsx')) {
    showToast('Hãy chọn tệp Excel .xlsx.', true);
    input.value = '';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('Tệp Excel không được lớn hơn 5 MB.', true);
    input.value = '';
    return;
  }
  input.disabled = true;
  try {
    const response = await fetch(`${API_ROOT}/products/import`, {
      method: 'POST',
      headers: { 'content-type': 'application/octet-stream' }, credentials: 'same-origin',
      body: file,
    });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401) {
      clearAccess();
      throw new Error(payload.message || 'Khóa quản trị không hợp lệ.');
    }
    if (!response.ok) throw new Error(payload.message || 'Không thể nhập danh sách sản phẩm.');
    await loadAll();
    const counts = payload.data || {};
    showToast(`Đã nhập ${Number(counts.total || 0).toLocaleString('vi-VN')} dòng: ${Number(counts.created || 0).toLocaleString('vi-VN')} mới, ${Number(counts.updated || 0).toLocaleString('vi-VN')} cập nhật.`);
  } catch (error) {
    showToast(error.message, true);
  } finally {
    input.disabled = false;
    input.value = '';
  }
}

function renderProducts() {
  const query = document.querySelector('#product-search').value.trim().toLocaleLowerCase('vi');
  const filter = document.querySelector('#product-status-filter').value;
  const categoryFilter = document.querySelector('#product-category-filter').value;
  const rows = state.products.filter((product) => {
    const searchable = [product.name, product.sku, product.category_name, product.brand_name].filter(Boolean).join(' ').toLocaleLowerCase('vi');
    const statusMatch = filter === 'all' || (filter === 'inactive' ? !product.is_active : product.is_active && product.status === filter);
    const categoryMatch = categoryFilter === 'all'
      || (categoryFilter === 'none' ? !product.category_id : String(product.category_id) === categoryFilter);
    return statusMatch && categoryMatch && (!query || searchable.includes(query));
  });
  document.querySelector('#product-count').textContent = `${rows.length} sản phẩm`;
  document.querySelector('#product-empty').hidden = rows.length > 0;
  const tableBody = document.querySelector('#product-table-body');
  tableBody.innerHTML = rows.map((product) => {
    const status = !product.is_active ? statusPill('inactive', 'Đã ẩn')
      : statusPill(product.status, product.status === 'draft' ? 'Bản nháp' : product.status === 'discontinued' ? 'Ngừng bán' : 'Đang bán');
    const stock = Number(product.stock_quantity) || 0;
    const imageUrl = resolveProductImageUrl(product.image_url);
    const image = imageUrl
      ? `<img class="product-cell__image" src="${escapeHtml(imageUrl)}" alt="" loading="lazy" />`
      : 'R/F';
    return `<tr>
      <td><div class="product-cell"><span class="product-cell__art">${image}</span><div class="product-cell__text"><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.brand_name || 'Chưa có thương hiệu')}</small></div></div></td>
      <td>${escapeHtml(product.sku)}</td><td>${escapeHtml(product.category_name || 'Chưa phân loại')}</td>
      <td><span class="stock-value ${stock <= 5 ? 'stock-value--low' : ''}">${stock.toLocaleString('vi-VN')}</span></td>
      <td><strong>${formatMoney(product.selling_price ?? product.price)}</strong>${Number(product.selling_price) < Number(product.price) ? `<small class="price-list-old-price">${formatMoney(product.price)}</small>` : ''}</td><td>${status}</td>
      <td><div class="row-actions"><button class="row-action" type="button" data-product-edit="${product.id}" aria-label="Sửa sản phẩm" title="Sửa">↗</button>${product.is_active ? `<button class="row-action row-action--danger" type="button" data-product-archive="${product.id}" aria-label="Ẩn sản phẩm" title="Ẩn khỏi cửa hàng">×</button>` : ''}</div></td>
    </tr>`;
  }).join('');
  tableBody.querySelectorAll('.product-cell__image').forEach((image) => {
    image.addEventListener('error', () => {
      if (image.parentElement) image.parentElement.textContent = 'R/F';
    }, { once: true });
  });
}

function renderInvoices() {
  const query = document.querySelector('#invoice-search').value.trim().toLocaleLowerCase('vi');
  const filter = document.querySelector('#invoice-status-filter').value;
  const rows = state.invoices.filter((invoice) => {
    const searchable = [invoice.invoice_code, invoice.customer_name, invoice.customer_email, invoice.customer_phone].filter(Boolean).join(' ').toLocaleLowerCase('vi');
    return (filter === 'all' || invoice.status === filter) && (!query || searchable.includes(query));
  });
  document.querySelector('#invoice-count').textContent = `${rows.length} hóa đơn`;
  document.querySelector('#invoice-empty').hidden = rows.length > 0;
  document.querySelector('#invoice-table-body').innerHTML = rows.map((invoice) => `
    <tr>
      <td><strong>${escapeHtml(invoice.invoice_code)}</strong><small>${Number(invoice.item_count) || 0} dòng hàng</small></td>
      <td><strong>${escapeHtml(invoice.customer_name)}</strong><small>${escapeHtml(invoice.customer_phone || invoice.customer_email || 'Khách lẻ')}</small></td>
      <td>${formatDate(invoice.created_at)}</td><td>${Number(invoice.item_count) || 0} món</td>
      <td>${statusPill(invoice.payment_status, PAYMENT_STATUS_LABELS[invoice.payment_status] || invoice.payment_status)}</td>
      <td>${statusPill(invoice.status, INVOICE_STATUS_LABELS[invoice.status] || invoice.status)}</td>
      <td><strong>${formatMoney(invoice.total_amount)}</strong></td>
      <td><div class="row-actions"><button class="row-action" type="button" data-invoice-edit="${invoice.id}" aria-label="Mở hóa đơn" title="Xem / sửa">↗</button>${['cancelled', 'refunded'].includes(invoice.status) || Number(invoice.paid_amount) >= Number(invoice.total_amount) ? '' : `<button class="row-action" type="button" data-invoice-payment="${invoice.id}" aria-label="Ghi nhận thanh toán" title="Ghi nhận thanh toán">₫</button>`}<button class="row-action row-action--danger" type="button" data-invoice-archive="${invoice.id}" aria-label="Lưu trữ hóa đơn" title="Lưu trữ">×</button></div></td>
    </tr>`).join('');
}

function renderOverview() {
  const products = [...state.products].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 4);
  document.querySelector('#overview-products').innerHTML = products.length ? products.map((product) => `
    <div class="overview-row"><div class="overview-row__main"><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.sku)} · ${escapeHtml(product.category_name || 'Chưa phân loại')}</small></div><div class="overview-row__aside">${formatMoney(product.selling_price ?? product.price)}<small>${Number(product.stock_quantity) || 0} trong kho</small></div></div>`).join('') : '<div class="overview-empty">Chưa có sản phẩm trong cửa hàng.</div>';
  const invoices = state.invoices.slice(0, 4);
  document.querySelector('#overview-invoices').innerHTML = invoices.length ? invoices.map((invoice) => `
    <div class="overview-row"><div class="overview-row__main"><strong>${escapeHtml(invoice.invoice_code)} · ${escapeHtml(invoice.customer_name)}</strong><small>${formatDate(invoice.created_at)} · ${INVOICE_STATUS_LABELS[invoice.status] || invoice.status}</small></div><div class="overview-row__aside">${formatMoney(invoice.total_amount)}</div></div>`).join('') : '<div class="overview-empty">Chưa có hóa đơn mới.</div>';
}

function renderPriceLists() {
  const query = document.querySelector('#price-list-search').value.trim().toLocaleLowerCase('vi');
  const filter = document.querySelector('#price-list-status-filter').value;
  const rows = state.priceLists.filter((list) => {
    const statusMatches = filter === 'all' || list.effective_status === filter;
    return statusMatches && (!query || String(list.name).toLocaleLowerCase('vi').includes(query));
  });
  document.querySelector('#price-list-count').textContent = `${rows.length} bảng giá`;
  document.querySelector('#price-list-empty').hidden = rows.length > 0;
  const labels = { active: ['active', 'Đang áp dụng'], scheduled: ['pending', 'Sắp áp dụng'], expired: ['inactive', 'Đã hết hạn'], inactive: ['inactive', 'Đã tắt'] };
  document.querySelector('#price-list-table-body').innerHTML = rows.map((list) => {
    const [status, label] = labels[list.effective_status] || labels.inactive;
    const schedule = `${formatDate(list.starts_on)} — ${list.ends_on ? formatDate(list.ends_on) : 'Không thời hạn'}`;
    return `<tr>
      <td><strong>${escapeHtml(list.name)}</strong><small>${escapeHtml(list.description || 'Bảng giá ưu đãi bán lẻ')}</small></td>
      <td>${Number(list.item_count || 0).toLocaleString('vi-VN')} sản phẩm</td>
      <td>${schedule}</td>
      <td>${statusPill(status, label)}</td>
      <td><div class="row-actions"><button class="row-action" type="button" data-price-list-edit="${list.id}" aria-label="Sửa bảng giá" title="Sửa">↗</button><button class="row-action row-action--danger" type="button" data-price-list-delete="${list.id}" aria-label="Xóa bảng giá" title="Xóa">×</button></div></td>
    </tr>`;
  }).join('');
}

function updatePriceListSelectionCount() {
  const count = document.querySelectorAll('#price-list-product-items [data-price-row]').length;
  document.querySelector('#price-list-selected-count').textContent = `Bảng giá áp dụng cho toàn bộ ${count.toLocaleString('vi-VN')} sản phẩm đang kinh doanh.`;
}

function renderPriceListProducts(selectedItems = new Map()) {
  const products = state.products
    .filter((product) => product.is_active && product.status === 'active')
    .sort((a, b) => String(a.name).localeCompare(String(b.name), 'vi'));
  document.querySelector('#price-list-product-items').innerHTML = products.map((product) => {
    const existing = selectedItems.get(String(product.id));
    const regularPrice = Number(product.price) || 0;
    const inputValue = existing?.price ?? regularPrice;
    const note = `Niêm yết ${formatMoney(regularPrice)} · Tồn ${Number(product.stock_quantity) || 0}`;
    return `<div class="price-list-product-row" data-price-row data-price-product="${product.id}" data-search="${escapeHtml(`${product.name} ${product.sku} ${product.category_name || ''}`.toLocaleLowerCase('vi'))}">
      <div class="price-list-product-choice"><span><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.sku)} · ${escapeHtml(note)}</small></span></div>
      <label class="price-list-product-value"><span>Giá trong bảng</span><input type="number" min="1" max="${regularPrice}" step="1" data-price-value="${product.id}" value="${escapeHtml(inputValue)}" required /></label>
    </div>`;
  }).join('');
  document.querySelector('#price-list-product-search').value = '';
  updatePriceListSelectionCount();
}

async function openPriceListEditor(listId = null) {
  priceListForm.reset();
  priceListForm.elements.id.value = '';
  const now = new Date();
  priceListForm.elements.starts_on.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  priceListForm.elements.is_active.checked = true;
  let selectedItems = new Map();
  if (listId) {
    try {
      const response = await adminFetch(`/price-lists/${listId}`);
      const list = response.data;
      priceListForm.elements.id.value = list.id;
      priceListForm.elements.name.value = list.name || '';
      priceListForm.elements.description.value = list.description || '';
      priceListForm.elements.starts_on.value = list.starts_on || '';
      priceListForm.elements.ends_on.value = list.ends_on || '';
      priceListForm.elements.is_active.checked = Boolean(list.is_active);
      selectedItems = new Map((list.items || []).map((item) => [String(item.product_id), item]));
    } catch (error) {
      showToast(error.message, true);
      return;
    }
  }
  document.querySelector('#price-list-dialog-title').textContent = listId ? 'Sửa bảng giá bán lẻ' : 'Tạo bảng giá bán lẻ';
  renderPriceListProducts(selectedItems);
  priceListDialog.showModal();
}

function priceListPayload() {
  const items = [...document.querySelectorAll('#price-list-product-items [data-price-row]')].map((row) => ({
    product_id: row.dataset.priceProduct,
    price: row.querySelector('[data-price-value]').value,
  }));
  return {
    name: priceListForm.elements.name.value,
    description: priceListForm.elements.description.value,
    starts_on: priceListForm.elements.starts_on.value,
    ends_on: priceListForm.elements.ends_on.value,
    is_active: priceListForm.elements.is_active.checked,
    items,
  };
}

async function submitPriceList(event) {
  event.preventDefault();
  const button = priceListForm.querySelector('[type="submit"]');
  const id = priceListForm.elements.id.value;
  button.disabled = true;
  try {
    await adminFetch(id ? `/price-lists/${id}` : '/price-lists', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(priceListPayload()),
    });
    priceListDialog.close();
    await loadAll();
    showToast(id ? 'Đã cập nhật bảng giá.' : 'Đã tạo bảng giá bán lẻ.');
  } catch (error) {
    showToast(error.message, true);
  } finally {
    button.disabled = false;
  }
}

async function handlePriceListAction(event) {
  const edit = event.target.closest('[data-price-list-edit]');
  if (edit) {
    await openPriceListEditor(edit.dataset.priceListEdit);
    return;
  }
  const remove = event.target.closest('[data-price-list-delete]');
  if (!remove) return;
  const list = state.priceLists.find((item) => String(item.id) === remove.dataset.priceListDelete);
  if (!list || !window.confirm(`Xóa bảng giá “${list.name}”? Giá ưu đãi sẽ ngừng áp dụng; hóa đơn đã tạo vẫn giữ nguyên.`)) return;
  try {
    await adminFetch(`/price-lists/${list.id}`, { method: 'DELETE' });
    await loadAll();
    showToast('Đã xóa bảng giá.');
  } catch (error) {
    showToast(error.message, true);
  }
}

function populateLookupSelects() {
  const sets = [
    ['#product-category', state.lookups.categories, 'Chưa phân loại'],
    ['#product-brand', state.lookups.brands, 'Chọn thương hiệu'],
    ['#product-supplier', state.lookups.suppliers, 'Chọn nhà cung cấp'],
  ];
  for (const [selector, records, placeholder] of sets) {
    const select = document.querySelector(selector);
    const selected = select.value;
    select.innerHTML = '<option value="">' + placeholder + '</option>' + records.map((record) => (
      '<option value="' + record.id + '" ' + (record.is_active === false ? 'disabled' : '') + '>'
      + escapeHtml(record.name) + (record.is_active === false ? ' (ngừng dùng)' : '') + '</option>'
    )).join('');
    select.value = selected;
    if (!productForm.elements.id.value && select.selectedOptions[0]?.disabled) select.value = '';
  }
  renderProductCategoryFilter();
}

function renderProductCategoryFilter() {
  const select = document.querySelector('#product-category-filter');
  if (!select) return;
  const records = state.lookups.categories || [];
  const missing = records.some((record) => record.is_active === false);
  const emptyCategory = state.products.some((product) => !product.category_id);
  const signature = [records.map((record) => record.id + ':' + record.name + ':' + record.is_active).join('|'), missing, emptyCategory].join('#');
  if (select.dataset.signature === signature) return;
  const selected = select.value;
  select.innerHTML = '<option value="all">Tất cả nhóm</option>'
    + records.map((record) => '<option value="' + record.id + '">'
      + escapeHtml(record.name) + (record.is_active === false ? ' (ngừng dùng)' : '') + '</option>').join('')
    + (emptyCategory ? '<option value="none">Chưa phân loại</option>' : '');
  select.value = Array.from(select.options).some((option) => option.value === selected) ? selected : 'all';
  select.dataset.signature = signature;
}

function catalogMeta(type = state.catalogType) {
  const labels = {
    categories: { label: 'danh mục', title: 'Danh mục', eyebrow: 'CATEGORY MANAGEMENT' },
    brands: { label: 'thương hiệu', title: 'Thương hiệu', eyebrow: 'BRAND MANAGEMENT' },
    suppliers: { label: 'nhà cung cấp', title: 'Nhà cung cấp', eyebrow: 'SUPPLIER MANAGEMENT' },
  };
  return labels[type] || labels.suppliers;
}

async function refreshCatalogRecords() {
  const result = await adminFetch('/catalog/' + state.catalogType);
  state.catalogRecords = result.data || [];
  renderCatalogRecords();
}

async function openCatalogManager(type) {
  state.catalogType = type;
  const meta = catalogMeta(type);
  document.querySelector('#catalog-dialog-eyebrow').textContent = meta.eyebrow;
  document.querySelector('#catalog-dialog-title').textContent = 'Quản lý ' + meta.title.toLocaleLowerCase('vi');
  document.querySelector('#catalog-dialog-description').textContent = 'Thêm, sửa hoặc xóa ' + meta.label + '. Mục đã xóa vẫn được giữ trong lịch sử sản phẩm.';
  document.querySelector('#catalog-add-button').textContent = '＋ Thêm ' + meta.label;
  catalogForm.hidden = true;
  catalogListPanel.hidden = false;
  try {
    await refreshCatalogRecords();
    catalogDialog.showModal();
  } catch (error) {
    showToast(error.message, true);
  }
}

function renderCatalogRecords() {
  const meta = catalogMeta();
  const activeCount = state.catalogRecords.filter((record) => record.is_active).length;
  document.querySelector('#catalog-count').textContent = activeCount + ' đang dùng · ' + state.catalogRecords.length + ' mục';
  catalogEmpty.hidden = state.catalogRecords.length > 0;
  catalogList.innerHTML = state.catalogRecords.map((record) => {
    const detail = state.catalogType === 'categories'
      ? [record.slug, record.description].filter(Boolean).join(' · ')
      : state.catalogType === 'suppliers'
        ? [record.contact_name, record.phone, record.email].filter(Boolean).join(' · ')
        : record.description || '';
    const actions = record.is_active
      ? '<button class="admin-button admin-button--quiet" type="button" data-catalog-edit="' + record.id + '">Sửa</button><button class="admin-button admin-button--quiet catalog-delete-button" type="button" data-catalog-delete="' + record.id + '">Xóa</button>'
      : '<button class="admin-button admin-button--quiet" type="button" data-catalog-edit="' + record.id + '">Sửa</button><button class="admin-button admin-button--quiet" type="button" data-catalog-restore="' + record.id + '">Khôi phục</button>';
    const status = record.is_active ? '' : '<span class="catalog-status">Đã ngừng dùng</span>';
    const emptyDetail = record.is_active ? 'Không có thông tin ' + meta.label + '.' : 'Không xuất hiện trong lựa chọn sản phẩm mới.';
    return '<article class="catalog-row"><div class="catalog-row__info"><strong>' + escapeHtml(record.name) + status
      + '</strong><small>' + escapeHtml(detail || emptyDetail) + '</small></div><div class="catalog-row__actions">'
      + actions + '</div></article>';
  }).join('');
}

function openCatalogEditor(record = null) {
  const meta = catalogMeta();
  catalogForm.reset();
  catalogForm.elements.name.maxLength = state.catalogType === 'suppliers' ? 200 : 150;
  catalogForm.elements.id.value = record?.id || '';
  catalogForm.elements.name.value = record?.name || '';
  catalogForm.elements.is_active.checked = record ? Boolean(record.is_active) : true;
  document.querySelector('#catalog-extra-fields').innerHTML = state.catalogType === 'categories'
    ? '<label class="field field--wide">Slug<input name="slug" maxlength="180" placeholder="vi-du-danh-muc" /></label><label class="field field--wide">Mô tả<textarea name="description" rows="3" maxlength="10000" placeholder="Mô tả danh mục"></textarea></label>'
    : state.catalogType === 'brands'
      ? '<label class="field field--wide">Mô tả<textarea name="description" rows="3" maxlength="10000" placeholder="Thông tin về thương hiệu"></textarea></label>'
      : '<label class="field">Người liên hệ<input name="contact_name" maxlength="200" /></label><label class="field">Email<input name="email" type="email" maxlength="255" /></label><label class="field">Số điện thoại<input name="phone" maxlength="30" /></label><label class="field field--wide">Địa chỉ<textarea name="address" rows="2" maxlength="2000"></textarea></label><label class="field field--wide">Ghi chú<textarea name="notes" rows="3" maxlength="10000"></textarea></label>';
  if (record) {
    for (const field of ['slug', 'description', 'contact_name', 'email', 'phone', 'address', 'notes']) {
      if (catalogForm.elements[field]) catalogForm.elements[field].value = record[field] || '';
    }
  }
  document.querySelector('#catalog-dialog-title').textContent = (record ? 'Sửa ' : 'Thêm ') + meta.label;
  document.querySelector('#catalog-save-button').textContent = record ? 'Lưu thay đổi' : 'Thêm mới';
  catalogListPanel.hidden = true;
  catalogForm.hidden = false;
  catalogForm.elements.name.focus();
}

function showCatalogList() {
  const meta = catalogMeta();
  document.querySelector('#catalog-dialog-title').textContent = 'Quản lý ' + meta.title.toLocaleLowerCase('vi');
  catalogForm.reset();
  catalogForm.hidden = true;
  catalogListPanel.hidden = false;
}

async function submitCatalog(event) {
  event.preventDefault();
  const button = document.querySelector('#catalog-save-button');
  const id = catalogForm.elements.id.value;
  const payload = Object.fromEntries(new FormData(catalogForm).entries());
  delete payload.id;
  payload.is_active = catalogForm.elements.is_active.checked;
  button.disabled = true;
  try {
    await adminFetch('/catalog/' + state.catalogType + (id ? '/' + id : ''), {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    });
    await loadAll();
    await refreshCatalogRecords();
    showCatalogList();
    showToast(id ? 'Đã cập nhật ' + catalogMeta().label + '.' : 'Đã thêm ' + catalogMeta().label + '.');
  } catch (error) {
    showToast(error.message, true);
  } finally {
    button.disabled = false;
  }
}

async function handleCatalogAction(event) {
  const editButton = event.target.closest('[data-catalog-edit]');
  const deleteButton = event.target.closest('[data-catalog-delete]');
  const restoreButton = event.target.closest('[data-catalog-restore]');
  const button = editButton || deleteButton || restoreButton;
  if (!button) return;
  const recordId = button.dataset.catalogEdit || button.dataset.catalogDelete || button.dataset.catalogRestore;
  const record = state.catalogRecords.find((item) => String(item.id) === recordId);
  if (!record) return;
  if (editButton) {
    openCatalogEditor(record);
    return;
  }
  const meta = catalogMeta();
  const restoring = Boolean(restoreButton);
  if (!restoring && !window.confirm('Xóa ' + meta.label + ' “' + record.name + '” khỏi các lựa chọn mới? Sản phẩm đã gắn vẫn giữ nguyên dữ liệu.')) return;
  try {
    if (restoring) {
      const payload = { ...record, is_active: true };
      await adminFetch('/catalog/' + state.catalogType + '/' + record.id, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await adminFetch('/catalog/' + state.catalogType + '/' + record.id, { method: 'DELETE' });
    }
    await loadAll();
    await refreshCatalogRecords();
    showToast(restoring ? 'Đã khôi phục ' + meta.label + '.' : 'Đã xóa ' + meta.label + '; dữ liệu lịch sử được giữ lại.');
  } catch (error) {
    showToast(error.message, true);
  }
}

function setView(view) {
  for (const section of document.querySelectorAll('.admin-view')) section.hidden = section.id !== `view-${view}`;
  for (const button of document.querySelectorAll('.admin-nav__item')) button.classList.toggle('is-active', button.dataset.view === view);
  const labels = { overview: 'Tổng quan', products: 'Sản phẩm', 'price-lists': 'Bảng giá', invoices: 'Hóa đơn' };
  document.querySelector('#breadcrumb-current').textContent = labels[view] || 'Tổng quan';
}

function renderProductPriceListPrices(product = null) {
  const target = document.querySelector('#product-price-list-prices');
  const empty = document.querySelector('#product-price-list-empty');
  const lists = state.priceLists.filter((list) => list.is_active && ['active', 'scheduled'].includes(list.effective_status));
  empty.hidden = lists.length > 0;
  target.innerHTML = lists.map((list) => {
    const savedPrice = product?.price_list_prices?.[String(list.id)];
    const hasSavedPrice = savedPrice !== undefined && savedPrice !== null;
    const value = hasSavedPrice ? savedPrice : product?.price ?? '';
    const endDate = list.ends_on ? ` · đến ${formatDate(list.ends_on)}` : '';
    return `<div class="product-price-list-row" data-product-price-list-row="${list.id}">
      <div><strong>${escapeHtml(list.name)}</strong><small>${list.effective_status === 'scheduled' ? 'Đã lên lịch' : 'Đang áp dụng'}${endDate}</small></div>
      <label class="field">Giá trong bảng (₫)<input type="number" min="1" step="1" data-product-price-list-price="${list.id}" data-auto-default="${hasSavedPrice ? 'false' : 'true'}" value="${escapeHtml(value)}" ${value ? `max="${Number(product?.price ?? value)}"` : ''} required /></label>
    </div>`;
  }).join('');
}

function openProduct(product = null) {
  productForm.reset();
  populateLookupSelects();
  productForm.elements.id.value = product?.id || '';
  productForm.elements.name.value = product?.name || '';
  productForm.elements.sku.value = product?.sku || '';
  productForm.elements.category_id.value = product?.category_id || '';
  productForm.elements.brand_id.value = product?.brand_id || '';
  productForm.elements.supplier_id.value = product?.supplier_id || '';
  productForm.elements.price.value = product?.price ?? '';
  productForm.elements.cost_price.value = product?.cost_price ?? '';
  productForm.elements.stock_quantity.value = product?.stock_quantity ?? 0;
  productForm.elements.status.value = product?.status || 'active';
  productForm.elements.is_active.checked = product ? Boolean(product.is_active) : true;
  productForm.elements.image_url.value = product?.image_url || '';
  renderProductImagePreview();
  productForm.elements.description.value = product?.description || '';
  renderProductPriceListPrices(product);
  document.querySelector('#product-dialog-title').textContent = product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm';
  productDialog.showModal();
}

function renderProductImagePreview() {
  const preview = document.querySelector('#product-image-preview');
  const image = document.querySelector('#product-image-preview-img');
  const name = document.querySelector('#product-image-preview-name');
  const imageUrl = productForm.elements.image_url.value.trim();
  if (!imageUrl) {
    preview.hidden = true;
    image.removeAttribute('src');
    name.textContent = '';
    return;
  }

  let parsedUrl;
  try {
    const raw = imageUrl.replace(/\\/g, '/');
    const isExternal = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(raw);
    const relativePath = raw.replace(/^\.\/+/, '');
    const source = isExternal
      ? raw
      : raw.startsWith('/')
        ? raw
        : relativePath.startsWith('public/images/')
          ? `/${relativePath.slice('public/'.length)}`
          : relativePath.startsWith('images/')
            ? `/${relativePath}`
            : `/images/${relativePath}`;
    parsedUrl = new URL(source, window.location.origin);
  } catch (_error) {
    preview.hidden = true;
    return;
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    preview.hidden = true;
    return;
  }

  image.hidden = false;
  image.onload = () => { name.textContent = imageUrl; };
  image.onerror = () => {
    image.hidden = true;
    name.textContent = `Không tìm thấy ảnh trong thư mục: ${imageUrl}`;
  };
  image.src = parsedUrl.href;
  name.textContent = imageUrl;
  preview.hidden = false;
}

async function loadImageLibrary() {
  imagePickerStatus.textContent = 'Đang tải danh sách ảnh...';
  imagePickerGrid.replaceChildren();
  try {
    const payload = await adminFetch('/images');
    const images = Array.isArray(payload.images) ? payload.images : [];
    if (!images.length) {
      imagePickerStatus.textContent = 'Chưa có ảnh. Hãy chép ảnh vào thư mục public/images rồi chọn Tải lại.';
      return;
    }

    imagePickerStatus.textContent = `${images.length} ảnh trong thư mục public/images`;
    imagePickerGrid.innerHTML = images.map((image) => `
      <button class="image-picker-card" type="button" data-image-url="${escapeHtml(image.url)}" data-image-name="${escapeHtml(image.name)}">
        <img src="${escapeHtml(image.url)}" alt="" loading="lazy" />
        <span>${escapeHtml(image.name)}</span>
      </button>`).join('');
  } catch (error) {
    imagePickerStatus.textContent = error.message;
  }
}

async function uploadProductImage(file) {
  if (!file) return;
  const typeByExtension = { '.avif': 'image/avif', '.gif': 'image/gif', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  const acceptedTypes = new Set(Object.values(typeByExtension));
  const contentType = acceptedTypes.has(file.type) ? file.type : typeByExtension[extension];
  if (!contentType) {
    imagePickerStatus.textContent = 'Chỉ hỗ trợ ảnh JPG, PNG, WebP, GIF hoặc AVIF.';
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    imagePickerStatus.textContent = 'Ảnh quá lớn. Vui lòng chọn file tối đa 8 MB.';
    return;
  }

  const button = document.querySelector('#product-image-upload-button');
  button.disabled = true;
  imagePickerStatus.textContent = `Đang tải ${file.name}...`;
  try {
    const response = await fetch(`${API_ROOT}/images`, {
      method: 'POST',
      headers: { 'content-type': contentType }, credentials: 'same-origin',
      body: file,
    });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401) {
      clearAccess();
      throw new Error(payload.message || 'Mã truy cập quản trị không hợp lệ.');
    }
    if (!response.ok) throw new Error(payload.message || 'Không thể tải ảnh lên.');
    productForm.elements.image_url.value = payload.data.url;
    renderProductImagePreview();
    imagePickerDialog.close();
    showToast('Đã tải ảnh vào thư viện và chọn cho sản phẩm.');
  } catch (error) {
    imagePickerStatus.textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

function useExternalProductImage() {
  const input = document.querySelector('#image-picker-url-input');
  try {
    const url = new URL(input.value.trim());
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('');
    productForm.elements.image_url.value = url.href;
    renderProductImagePreview();
    imagePickerDialog.close();
    showToast('Đã dùng liên kết ảnh cho sản phẩm.');
  } catch (_error) {
    imagePickerStatus.textContent = 'Hãy nhập một liên kết ảnh bắt đầu bằng http:// hoặc https://.';
  }
}

productForm.elements.price.addEventListener('input', () => {
  const regularPrice = Number(productForm.elements.price.value);
  for (const input of productForm.querySelectorAll('[data-product-price-list-price]')) {
    if (Number.isFinite(regularPrice) && regularPrice > 0) {
      input.max = String(regularPrice);
      if (input.dataset.autoDefault === 'true') input.value = String(regularPrice);
    } else {
      input.removeAttribute('max');
      if (input.dataset.autoDefault === 'true') input.value = '';
    }
  }
});

document.querySelector('#product-price-list-prices').addEventListener('input', (event) => {
  const input = event.target.closest('[data-product-price-list-price]');
  if (input) input.dataset.autoDefault = 'false';
});

function activeProducts() {
  return state.products.filter((product) => product.is_active && product.status === 'active');
}

function addInvoiceLine(value = {}) {
  const row = document.createElement('div');
  row.className = 'invoice-line';
  row.dataset.invoiceLine = '';
  const productField = document.createElement('label');
  productField.className = 'field';
  productField.textContent = 'Sản phẩm';
  const productSelect = document.createElement('select');
  productSelect.className = 'invoice-product-select';
  productSelect.required = true;
  const prompt = document.createElement('option');
  prompt.value = '';
  prompt.textContent = 'Chọn sản phẩm';
  productSelect.append(prompt);
  const products = [...activeProducts()];
  if (value.product_id && !products.some((product) => String(product.id) === String(value.product_id))) {
    const unavailable = state.products.find((product) => String(product.id) === String(value.product_id));
    if (unavailable) products.unshift(unavailable);
  }
  products.forEach((product) => {
    const option = document.createElement('option');
    option.value = String(product.id);
    option.textContent = `${product.name} · ${product.sku}${product.is_active ? '' : ' · đã ẩn'}`;
    productSelect.append(option);
  });
  productSelect.value = value.product_id || '';
  productField.append(productSelect);

  const quantityField = document.createElement('label');
  quantityField.className = 'field';
  quantityField.textContent = 'Số lượng';
  const quantityInput = document.createElement('input');
  quantityInput.className = 'invoice-quantity';
  quantityInput.type = 'number';
  quantityInput.min = '1';
  quantityInput.step = '1';
  quantityInput.required = true;
  quantityInput.value = value.quantity || 1;
  quantityField.append(quantityInput);

  const remove = document.createElement('button');
  remove.className = 'invoice-line__remove';
  remove.type = 'button';
  remove.dataset.removeInvoiceLine = '';
  remove.setAttribute('aria-label', 'Xóa dòng sản phẩm');
  remove.textContent = '×';
  row.append(productField, quantityField, remove);
  document.querySelector('#invoice-items-list').append(row);
}

function calculateInvoicePreview() {
  const subtotal = [...document.querySelectorAll('.invoice-line')].reduce((total, line) => {
    const productId = line.querySelector('.invoice-product-select').value;
    const product = state.products.find((record) => String(record.id) === productId);
    const count = Number(line.querySelector('.invoice-quantity').value) || 0;
    return total + (Number(product?.selling_price ?? product?.price) || 0) * count;
  }, 0);
  const discount = Number(invoiceForm.elements.discount_amount.value) || 0;
  const tax = Number(invoiceForm.elements.tax_amount.value) || 0;
  const shipping = Number(invoiceForm.elements.shipping_fee.value) || 0;
  document.querySelector('#invoice-subtotal').textContent = formatMoney(subtotal);
  document.querySelector('#invoice-discount').textContent = `− ${formatMoney(discount)}`;
  document.querySelector('#invoice-total').textContent = formatMoney(Math.max(0, subtotal - discount + tax + shipping));
}

function renderPayments(payments) {
  const section = document.querySelector('#payment-history-section');
  section.hidden = false;
  const target = document.querySelector('#payment-history');
  target.innerHTML = payments.length ? payments.map((payment) => `
    <div class="payment-history__row"><div><strong>${formatMoney(payment.amount)}</strong><span>${escapeHtml(PAYMENT_METHOD_LABELS[payment.method] || payment.method)} · ${formatDate(payment.paid_at || payment.created_at)}</span></div>${statusPill(payment.status, payment.status === 'completed' ? 'Đã nhận' : payment.status)}</div>`).join('') : '<p class="payment-history__empty">Chưa có khoản thanh toán nào.</p>';
}

function renderStatusHistory(history) {
  const section = document.querySelector('#status-history-section');
  section.hidden = false;
  const target = document.querySelector('#status-history');
  target.innerHTML = history.length ? history.map((entry) => `
    <div class="payment-history__row"><div><strong>${entry.old_status ? `${escapeHtml(INVOICE_STATUS_LABELS[entry.old_status] || entry.old_status)} → ` : ''}${escapeHtml(INVOICE_STATUS_LABELS[entry.new_status] || entry.new_status)}</strong><span>${escapeHtml(entry.note || 'Cập nhật trạng thái')} · ${formatDate(entry.created_at)}</span></div></div>`).join('') : '<p class="payment-history__empty">Chưa có lịch sử trạng thái.</p>';
}

async function openInvoice(invoiceId = null) {
  invoiceForm.reset();
  invoiceForm.elements.id.value = '';
  document.querySelector('#invoice-items-list').replaceChildren();
  document.querySelector('#invoice-code-label').textContent = '';
  document.querySelector('#payment-history-section').hidden = true;
  document.querySelector('#status-history-section').hidden = true;
  document.querySelector('#record-payment-button').hidden = true;
  document.querySelector('#invoice-dialog-title').textContent = invoiceId ? 'Chỉnh sửa hóa đơn' : 'Tạo hóa đơn';
  invoiceForm.elements.status.value = 'pending';
  invoiceForm.elements.discount_amount.value = 0;
  invoiceForm.elements.tax_amount.value = 0;
  invoiceForm.elements.shipping_fee.value = 0;

  if (invoiceId) {
    try {
      const response = await adminFetch(`/invoices/${invoiceId}`);
      const invoice = response.data;
      invoiceForm.elements.id.value = invoice.id;
      invoiceForm.elements.customer_name.value = invoice.customer_name || '';
      invoiceForm.elements.customer_email.value = invoice.customer_email || '';
      invoiceForm.elements.customer_phone.value = invoice.customer_phone || '';
      invoiceForm.elements.billing_address.value = invoice.billing_address || '';
      invoiceForm.elements.shipping_address.value = invoice.shipping_address || '';
      invoiceForm.elements.notes.value = invoice.notes || '';
      invoiceForm.elements.status.value = invoice.status;
      invoiceForm.elements.discount_amount.value = Number(invoice.discount_amount) || 0;
      invoiceForm.elements.tax_amount.value = Number(invoice.tax_amount) || 0;
      invoiceForm.elements.shipping_fee.value = Number(invoice.shipping_fee) || 0;
      document.querySelector('#invoice-dialog-title').textContent = 'Chỉnh sửa hóa đơn';
      document.querySelector('#invoice-code-label').textContent = `${invoice.invoice_code} · ${PAYMENT_STATUS_LABELS[invoice.payment_status] || invoice.payment_status}`;
      invoice.items.forEach((item) => addInvoiceLine({ product_id: item.product_id, quantity: item.quantity }));
      renderPayments(invoice.payments || []);
      renderStatusHistory(invoice.status_history || []);
      const paymentButton = document.querySelector('#record-payment-button');
      paymentButton.hidden = ['cancelled', 'refunded'].includes(invoice.status)
        || invoice.payment_status === 'paid'
        || Number((invoice.payments || []).filter((payment) => payment.status === 'completed').reduce((total, payment) => total + Number(payment.amount), 0)) >= Number(invoice.total_amount);
      paymentButton.dataset.invoiceId = String(invoice.id);
    } catch (error) {
      showToast(error.message, true);
      return;
    }
  } else {
    addInvoiceLine();
  }
  calculateInvoicePreview();
  invoiceDialog.showModal();
}

function openPayment(invoiceId) {
  const invoice = state.invoices.find((record) => String(record.id) === String(invoiceId));
  if (!invoice) return;
  const remaining = Math.max(0, Number(invoice.total_amount) - Number(invoice.paid_amount));
  if (remaining <= 0) {
    showToast('Hóa đơn đã thanh toán đủ.', true);
    return;
  }
  paymentForm.reset();
  paymentForm.elements.invoice_id.value = invoice.id;
  document.querySelector('#payment-invoice-label').textContent = `${invoice.invoice_code} · ${invoice.customer_name} · Còn lại ${formatMoney(remaining)}`;
  if (invoiceDialog.open) invoiceDialog.close();
  paymentDialog.showModal();
}

function invoicePayload() {
  const lines = [...document.querySelectorAll('.invoice-line')].map((line) => ({
    product_id: line.querySelector('.invoice-product-select').value,
    quantity: line.querySelector('.invoice-quantity').value,
  }));
  return {
    customer_name: invoiceForm.elements.customer_name.value,
    customer_email: invoiceForm.elements.customer_email.value,
    customer_phone: invoiceForm.elements.customer_phone.value,
    billing_address: invoiceForm.elements.billing_address.value,
    shipping_address: invoiceForm.elements.shipping_address.value,
    notes: invoiceForm.elements.notes.value,
    status: invoiceForm.elements.status.value,
    discount_amount: invoiceForm.elements.discount_amount.value || 0,
    tax_amount: invoiceForm.elements.tax_amount.value || 0,
    shipping_fee: invoiceForm.elements.shipping_fee.value || 0,
    items: lines,
  };
}

async function submitProduct(event) {
  event.preventDefault();
  const button = productForm.querySelector('[type="submit"]');
  button.disabled = true;
  const id = productForm.elements.id.value;
  const payload = Object.fromEntries(new FormData(productForm).entries());
  payload.is_active = productForm.elements.is_active.checked;
  payload.price_list_prices = Object.fromEntries([...productForm.querySelectorAll('[data-product-price-list-price]')]
    .map((input) => [input.dataset.productPriceListPrice, input.value]));
  try {
    await adminFetch(id ? `/products/${id}` : '/products', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    productDialog.close();
    await loadAll();
    showToast(id ? 'Đã cập nhật sản phẩm.' : 'Đã thêm sản phẩm vào danh mục.');
  } catch (error) {
    showToast(error.message, true);
  } finally {
    button.disabled = false;
  }
}

async function submitInvoice(event) {
  event.preventDefault();
  const button = invoiceForm.querySelector('[type="submit"]');
  button.disabled = true;
  const id = invoiceForm.elements.id.value;
  try {
    await adminFetch(id ? `/invoices/${id}` : '/invoices', {
      method: id ? 'PUT' : 'POST', body: JSON.stringify(invoicePayload()),
    });
    invoiceDialog.close();
    await loadAll();
    showToast(id ? 'Đã cập nhật hóa đơn và tồn kho.' : 'Đã tạo hóa đơn và ghi nhận xuất kho.');
  } catch (error) {
    showToast(error.message, true);
  } finally {
    button.disabled = false;
  }
}

async function submitPayment(event) {
  event.preventDefault();
  const button = paymentForm.querySelector('[type="submit"]');
  button.disabled = true;
  const invoiceId = paymentForm.elements.invoice_id.value;
  const payload = Object.fromEntries(new FormData(paymentForm).entries());
  delete payload.invoice_id;
  try {
    await adminFetch(`/invoices/${invoiceId}/payments`, { method: 'POST', body: JSON.stringify(payload) });
    paymentDialog.close();
    await loadAll();
    showToast('Đã ghi nhận khoản thanh toán.');
    if (state.reopenInvoiceId) {
      const reopenId = state.reopenInvoiceId;
      state.reopenInvoiceId = null;
      await openInvoice(reopenId);
    }
  } catch (error) {
    showToast(error.message, true);
  } finally {
    button.disabled = false;
  }
}

document.querySelectorAll('[data-view]').forEach((button) => {
  button.addEventListener('click', () => setView(button.dataset.view));
});

accessForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!accessEmailInput.value.trim() || !accessPasswordInput.value) return;
  await connectToAdmin();
});

document.querySelector('#logout-button').addEventListener('click', logoutAdmin);
document.querySelector('#new-product-button').addEventListener('click', () => openProduct());
document.querySelector('#product-image-picker-button').addEventListener('click', async () => {
  imagePickerDialog.showModal();
  await loadImageLibrary();
});
document.querySelector('#image-picker-refresh').addEventListener('click', loadImageLibrary);
document.querySelector('#product-image-upload-button').addEventListener('click', () => {
  document.querySelector('#product-image-upload-input').click();
});
document.querySelector('#product-image-upload-input').addEventListener('change', async (event) => {
  await uploadProductImage(event.target.files[0]);
  event.target.value = '';
});
document.querySelector('#image-picker-use-url').addEventListener('click', useExternalProductImage);
document.querySelector('#image-picker-url-input').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    useExternalProductImage();
  }
});
imagePickerGrid.addEventListener('click', (event) => {
  const selected = event.target.closest('[data-image-url]');
  if (!selected) return;
  productForm.elements.image_url.value = selected.dataset.imageUrl;
  renderProductImagePreview();
  imagePickerDialog.close();
});
document.querySelector('#product-image-clear').addEventListener('click', () => {
  productForm.elements.image_url.value = '';
  renderProductImagePreview();
});
document.querySelector('#new-invoice-button').addEventListener('click', () => openInvoice());
document.querySelector('#new-price-list-button').addEventListener('click', () => openPriceListEditor());
priceListForm.addEventListener('submit', submitPriceList);
document.querySelector('#price-list-search').addEventListener('input', renderPriceLists);
document.querySelector('#price-list-status-filter').addEventListener('change', renderPriceLists);
document.querySelector('#price-list-table-body').addEventListener('click', handlePriceListAction);
document.querySelector('#price-list-product-items').addEventListener('input', updatePriceListSelectionCount);
document.querySelector('#price-list-product-search').addEventListener('input', (event) => {
  const query = event.target.value.trim().toLocaleLowerCase('vi');
  for (const row of document.querySelectorAll('#price-list-product-items [data-price-row]')) {
    row.hidden = query && !row.dataset.search.includes(query);
  }
});
document.querySelector('#dashboard-period').addEventListener('change', (event) => refreshDashboard(event.target.value));
document.querySelector('#product-export-button').addEventListener('click', downloadProductsExcel);
document.querySelector('#product-import-file').addEventListener('change', (event) => importProductsExcel(event.target.files[0]));
document.querySelectorAll('[data-catalog-manage]').forEach((button) => {
  button.addEventListener('click', () => openCatalogManager(button.dataset.catalogManage));
});
document.querySelector('#catalog-add-button').addEventListener('click', () => openCatalogEditor());
document.querySelector('#catalog-cancel-edit').addEventListener('click', () => {
  showCatalogList();
});
catalogForm.addEventListener('submit', submitCatalog);
catalogList.addEventListener('click', handleCatalogAction);
document.querySelector('#product-search').addEventListener('input', renderProducts);
document.querySelector('#product-status-filter').addEventListener('change', renderProducts);
document.querySelector('#product-category-filter').addEventListener('change', renderProducts);
document.querySelector('#invoice-search').addEventListener('input', renderInvoices);
document.querySelector('#invoice-status-filter').addEventListener('change', renderInvoices);
productForm.addEventListener('submit', submitProduct);
invoiceForm.addEventListener('submit', submitInvoice);
paymentForm.addEventListener('submit', submitPayment);
document.querySelector('#add-invoice-item').addEventListener('click', () => {
  addInvoiceLine();
  calculateInvoicePreview();
});

document.querySelector('#invoice-items-list').addEventListener('click', (event) => {
  if (!event.target.closest('[data-remove-invoice-line]')) return;
  const lines = document.querySelectorAll('.invoice-line');
  if (lines.length <= 1) {
    showToast('Hóa đơn cần có ít nhất một sản phẩm.', true);
    return;
  }
  event.target.closest('.invoice-line').remove();
  calculateInvoicePreview();
});
document.querySelector('#invoice-items-list').addEventListener('input', calculateInvoicePreview);
document.querySelector('#invoice-items-list').addEventListener('change', calculateInvoicePreview);
for (const field of ['discount_amount', 'tax_amount', 'shipping_fee']) {
  invoiceForm.elements[field].addEventListener('input', calculateInvoicePreview);
}

document.querySelector('#product-table-body').addEventListener('click', async (event) => {
  const edit = event.target.closest('[data-product-edit]');
  if (edit) {
    const product = state.products.find((record) => String(record.id) === edit.dataset.productEdit);
    if (product) openProduct(product);
    return;
  }
  const archive = event.target.closest('[data-product-archive]');
  if (!archive) return;
  const product = state.products.find((record) => String(record.id) === archive.dataset.productArchive);
  if (!product || !window.confirm(`Ẩn “${product.name}” khỏi cửa hàng? Lịch sử bán hàng sẽ được giữ lại.`)) return;
  try {
    await adminFetch(`/products/${product.id}`, { method: 'DELETE' });
    await loadAll();
    showToast('Đã ẩn sản phẩm khỏi cửa hàng.');
  } catch (error) {
    showToast(error.message, true);
  }
});

document.querySelector('#invoice-table-body').addEventListener('click', async (event) => {
  const edit = event.target.closest('[data-invoice-edit]');
  if (edit) {
    await openInvoice(edit.dataset.invoiceEdit);
    return;
  }
  const payment = event.target.closest('[data-invoice-payment]');
  if (payment) {
    state.reopenInvoiceId = payment.dataset.invoicePayment;
    openPayment(payment.dataset.invoicePayment);
    return;
  }
  const archive = event.target.closest('[data-invoice-archive]');
  if (!archive) return;
  const invoice = state.invoices.find((record) => String(record.id) === archive.dataset.invoiceArchive);
  if (!invoice || !window.confirm(`Lưu trữ hóa đơn ${invoice.invoice_code}? Dữ liệu thanh toán sẽ được giữ lại.`)) return;
  try {
    await adminFetch(`/invoices/${invoice.id}`, { method: 'DELETE' });
    await loadAll();
    showToast('Đã lưu trữ hóa đơn.');
  } catch (error) {
    showToast(error.message, true);
  }
});

document.querySelector('#record-payment-button').addEventListener('click', () => {
  const id = document.querySelector('#record-payment-button').dataset.invoiceId;
  state.reopenInvoiceId = id;
  openPayment(id);
});

document.querySelectorAll('[data-close-dialog]').forEach((button) => {
  button.addEventListener('click', () => document.querySelector(`#${button.dataset.closeDialog}`).close());
});

for (const dialog of document.querySelectorAll('dialog')) {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}

restoreAdminSession();
