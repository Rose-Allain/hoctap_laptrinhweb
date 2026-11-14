const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');

const imageDirectory = path.join(__dirname, '..', 'public', 'images');
const allowedExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);
const uploadFormats = {
  'image/avif': { extension: '.avif', matches: (buffer) => buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp' && ['avif', 'avis'].includes(buffer.toString('ascii', 8, 12)) },
  'image/gif': { extension: '.gif', matches: (buffer) => ['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6)) },
  'image/jpeg': { extension: '.jpg', matches: (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  'image/png': { extension: '.png', matches: (buffer) => buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  'image/webp': { extension: '.webp', matches: (buffer) => buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP' },
};

async function collectImages(directory, relativeDirectory = '') {
  let entries;
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }

  const nested = await Promise.all(entries.map(async (entry) => {
    if (entry.name.startsWith('.')) return [];
    const relativePath = path.join(relativeDirectory, entry.name);
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectImages(absolutePath, relativePath);
    if (!entry.isFile() || !allowedExtensions.has(path.extname(entry.name).toLowerCase())) return [];

    const url = `/images/${relativePath.split(path.sep).map(encodeURIComponent).join('/')}`;
    return [{ name: relativePath.split(path.sep).join('/'), url }];
  }));

  return nested.flat();
}

async function listImages(_req, res) {
  try {
    const images = await collectImages(imageDirectory);
    images.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    return res.json({ images });
  } catch (error) {
    console.error('Không thể đọc thư viện ảnh:', error);
    return res.status(500).json({ message: 'Không thể tải thư mục ảnh.' });
  }
}

async function uploadImage(req, res) {
  const contentType = (req.get('content-type') || '').split(';', 1)[0].trim().toLowerCase();
  const format = uploadFormats[contentType];
  if (!format) {
    return res.status(415).json({ message: 'Chỉ hỗ trợ ảnh JPG, PNG, WebP, GIF hoặc AVIF.' });
  }
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    return res.status(400).json({ message: 'File ảnh không có dữ liệu.' });
  }
  if (!format.matches(req.body)) {
    return res.status(400).json({ message: 'Nội dung file không khớp với định dạng ảnh đã chọn.' });
  }

  const filename = `product-${randomUUID()}${format.extension}`;
  try {
    await fs.mkdir(imageDirectory, { recursive: true });
    await fs.writeFile(path.join(imageDirectory, filename), req.body, { flag: 'wx' });
    return res.status(201).json({ data: { name: filename, url: `/images/${filename}` } });
  } catch (error) {
    console.error('Không thể lưu ảnh sản phẩm:', error);
    return res.status(500).json({ message: 'Không thể lưu ảnh sản phẩm.' });
  }
}

module.exports = { listImages, uploadImage };
