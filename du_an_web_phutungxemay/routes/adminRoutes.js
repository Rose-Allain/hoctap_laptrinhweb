const express = require('express');
const admin = require('../controllers/adminController');
const priceLists = require('../controllers/priceListController');
const spreadsheet = require('../controllers/productSpreadsheetController');
const imageLibrary = require('../controllers/imageLibraryController');
const requireAdminSession = require('../middleware/adminAuth');

const router = express.Router();

router.use(requireAdminSession);

router.get('/summary', admin.getSummary);
router.get('/dashboard', admin.getDashboard);
router.get('/lookups', admin.getLookups);
router.get('/images', imageLibrary.listImages);
router.post('/images', express.raw({ type: 'image/*', limit: '8mb' }), imageLibrary.uploadImage);
router.get('/catalog/:type', admin.getCatalog);
router.post('/catalog/:type', admin.createCatalog);
router.put('/catalog/:type/:id', admin.updateCatalog);
router.delete('/catalog/:type/:id', admin.archiveCatalog);

router.get('/products', admin.getProducts);
router.post('/products', admin.createProduct);
router.put('/products/:id', admin.updateProduct);
router.delete('/products/:id', admin.archiveProduct);
router.get('/products/export', spreadsheet.exportProducts);
router.post('/products/import', express.raw({ type: '*/*', limit: '5mb' }), spreadsheet.importProducts);

router.get('/price-lists', priceLists.getPriceLists);
router.get('/price-lists/:id', priceLists.getPriceList);
router.post('/price-lists', priceLists.createPriceList);
router.put('/price-lists/:id', priceLists.updatePriceList);
router.delete('/price-lists/:id', priceLists.deletePriceList);

router.get('/invoices', admin.getInvoices);
router.post('/invoices', admin.createInvoice);
router.get('/invoices/:id', admin.getInvoice);
router.put('/invoices/:id', admin.updateInvoice);
router.delete('/invoices/:id', admin.archiveInvoice);
router.post('/invoices/:id/payments', admin.createPayment);

module.exports = router;
