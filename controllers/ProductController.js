const Product = require('../models/Product');
const { Op } = require('sequelize');
const { generateStockData } = require('../services/stockCodeGenerator');

function parseJsonField(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return value.split(/[\n,]/).map(item => item.trim()).filter(Boolean);
        }
    }
    return [];
}

function extractColorNames(value) {
    const rawList = parseJsonField(value);
    return rawList
        .map(item => {
            if (!item) return '';
            if (typeof item === 'string') return item;
            if (typeof item === 'object') {
                if (item.name) return item.name;
                if (item.renk || item.color) return item.renk || item.color;
            }
            return '';
        })
        .map(item => item.trim())
        .filter(Boolean);
}

function sanitizeSizeValue(value) {
    const trimmed = String(value ?? '').trim();
    if (!trimmed) return '';
    return trimmed.replace(/\s*cm$/i, '').trim() || '';
}

function sanitizeSizeList(value) {
    return Array.from(new Set(
        parseJsonField(value)
            .map(sanitizeSizeValue)
            .filter(Boolean)
    ));
}

class ProductController {
    // Tüm ürünleri getir
    static async getAllProducts(req, res) {
        try {
            const pageParam = req.query.page;
            const pageSizeParam = req.query.pageSize;
            const usePagination = pageParam !== undefined || pageSizeParam !== undefined;

            if (usePagination) {
                const page = Math.max(parseInt(pageParam, 10) || 1, 1);
                const pageSize = Math.min(Math.max(parseInt(pageSizeParam, 10) || 20, 1), 100);
                const offset = (page - 1) * pageSize;

                const { rows, count } = await Product.findAndCountAll({
                    order: [['updatedAt', 'DESC']],
                    limit: pageSize,
                    offset
                });

                const totalPages = Math.max(1, Math.ceil(count / pageSize));

                res.json({
                    items: rows,
                    totalItems: count,
                    totalPages: totalPages,
                    currentPage: Math.min(page, totalPages),
                    pageSize
                });
                return;
            }

            const products = await Product.findAll({ order: [['updatedAt', 'DESC']] });
            res.json(products);
        } catch (error) {
            console.error('Ürünler getirilirken hata:', error);
            res.status(500).json({ error: 'Ürünler getirilirken bir hata oluştu' });
        }
    }

    // Tek bir ürün getir
    static async getProductById(req, res) {
        try {
            const product = await Product.findByPk(req.params.id);
            if (!product) {
                return res.status(404).json({ error: 'Ürün bulunamadı' });
            }
            res.json(product);
        } catch (error) {
            console.error('Ürün getirilirken hata:', error);
            res.status(500).json({ error: 'Ürün getirilirken bir hata oluştu' });
        }
    }

    // Yeni ürün ekle
    static async createProduct(req, res) {
        try {
            const gelenRenkKombinasyonlari = extractColorNames(req.body.renkKombinasyonlari);
            const gelenRenklerListesi = extractColorNames(req.body.renkler);
            const renkKombinasyonlari = gelenRenkKombinasyonlari.length ? gelenRenkKombinasyonlari : gelenRenklerListesi;
            const gelenBedenler = sanitizeSizeList(req.body.bedenler);

            const stockData = generateStockData({
                urunAdi: req.body.urunAdi,
                renkKombinasyonlari,
                bedenler: gelenBedenler,
                prefix: req.body.stokKoduOnEki
            });

            req.body.urunKodu = req.body.urunKodu || stockData.anaStokKodu || stockData.baseCode;
            req.body.varyantlar = Array.isArray(stockData.varyantlar)
                ? stockData.varyantlar.map(variant => ({
                    ...variant,
                    beden: sanitizeSizeValue(variant.beden) || 'STD'
                }))
                : [];
            req.body.renkKombinasyonlari = stockData.kullanilanRenkKombinasyonlari;
            req.body.bedenler = sanitizeSizeList(stockData.bedenler);

            req.body.renkler = extractColorNames(req.body.renkler);
            if (!req.body.renkler.length) {
                req.body.renkler = stockData.kullanilanRenkKombinasyonlari;
            }

            // Ürün kodu kontrolü
            const existingProduct = await Product.findOne({
                where: { urunKodu: req.body.urunKodu }
            });

            if (existingProduct) {
                return res.status(400).json({
                    error: 'Ürün kodu zaten kullanılmış',
                    details: 'urunKodu must be unique'
                });
            }

            const product = await Product.create(req.body);
            res.status(201).json(product);
        } catch (error) {
            console.error('Ürün oluşturulurken hata:', error);
            
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({
                    error: 'Geçersiz veri girişi',
                    details: error.errors.map(e => e.message)
                });
            }

            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({
                    error: 'Ürün kodu zaten kullanılmış',
                    details: error.errors.map(e => e.message)
                });
            }

            res.status(500).json({
                error: 'Ürün oluşturulurken bir hata oluştu',
                details: error.message
            });
        }
    }

    // Ürün güncelle
    static async updateProduct(req, res) {
        try {
            const product = await Product.findByPk(req.params.id);
            if (!product) {
                return res.status(404).json({ error: 'Ürün bulunamadı' });
            }

            // İndirim işlemi
            if (req.body.indirimOrani) {
                const indirimOrani = parseFloat(req.body.indirimOrani);
                if (!isNaN(indirimOrani) && indirimOrani > 0 && indirimOrani <= 100) {
                    req.body.urunFiyati = parseFloat(product.urunFiyati) * (1 - indirimOrani / 100);
                    req.body.bayiFiyati = parseFloat(product.bayiFiyati) * (1 - indirimOrani / 100);
                }
                delete req.body.indirimOrani; // İndirim oranını veritabanına kaydetmeye gerek yok
            }

            const yeniRenkKombinasyonlari = extractColorNames(req.body.renkKombinasyonlari);
            const yeniRenklerListesi = extractColorNames(req.body.renkler);
            const renkKombinasyonKaynak = yeniRenkKombinasyonlari.length ? yeniRenkKombinasyonlari : yeniRenklerListesi;
            const mevcutKombinasyonlar = renkKombinasyonKaynak.length ? renkKombinasyonKaynak : extractColorNames(product.renkKombinasyonlari);

            const yeniBedenler = sanitizeSizeList(req.body.bedenler);
            const mevcutBedenler = yeniBedenler.length ? yeniBedenler : sanitizeSizeList(product.bedenler);

            const stockData = generateStockData({
                urunAdi: req.body.urunAdi || product.urunAdi,
                renkKombinasyonlari: mevcutKombinasyonlar,
                bedenler: mevcutBedenler,
                prefix: req.body.stokKoduOnEki
            });

            req.body.urunKodu = stockData.anaStokKodu || stockData.baseCode;
            req.body.varyantlar = Array.isArray(stockData.varyantlar)
                ? stockData.varyantlar.map(variant => ({
                    ...variant,
                    beden: sanitizeSizeValue(variant.beden) || 'STD'
                }))
                : [];
            req.body.renkKombinasyonlari = stockData.kullanilanRenkKombinasyonlari;
            req.body.bedenler = sanitizeSizeList(stockData.bedenler);

            req.body.renkler = extractColorNames(req.body.renkler);
            if (!req.body.renkler.length) {
                req.body.renkler = stockData.kullanilanRenkKombinasyonlari;
            }

            await product.update(req.body);
            res.json(product);
        } catch (error) {
            console.error('Ürün güncellenirken hata:', error);
            
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({
                    error: 'Geçersiz veri girişi',
                    details: error.errors.map(e => e.message)
                });
            }

            res.status(500).json({
                error: 'Ürün güncellenirken bir hata oluştu',
                details: error.message
            });
        }
    }

    // Ürün sil
    static async deleteProduct(req, res) {
        try {
            const product = await Product.findByPk(req.params.id);
            if (!product) {
                return res.status(404).json({ error: 'Ürün bulunamadı' });
            }
            await product.destroy();
            res.json({ message: 'Ürün başarıyla silindi' });
        } catch (error) {
            console.error('Ürün silinirken hata:', error);
            res.status(500).json({ error: 'Ürün silinirken bir hata oluştu' });
        }
    }

    // Öne çıkan ürünleri getir
    static async getFeaturedProducts(req, res) {
        try {
            const products = await Product.findAll({
                where: { oneCikan: true }
            });
            res.json(products);
        } catch (error) {
            console.error('Öne çıkan ürünler getirilirken hata:', error);
            res.status(500).json({ error: 'Öne çıkan ürünler getirilirken bir hata oluştu' });
        }
    }

    // Düşük stoklu ürünleri getir
    static async getLowStockProducts(req, res) {
        try {
            const products = await Product.findAll({
                where: {
                    stokSayisi: {
                        [Op.lt]: 10 // Stok sayısı 10'dan az olanlar
                    }
                }
            });
            res.json(products);
        } catch (error) {
            console.error('Düşük stoklu ürünler getirilirken hata:', error);
            res.status(500).json({ error: 'Düşük stoklu ürünler getirilirken bir hata oluştu' });
        }
    }

    // Kategoriye göre ürünleri getir
    static async getProductsByCategory(req, res) {
        try {
            const products = await Product.findAll({
                where: {
                    kategori: req.params.kategori
                }
            });
            res.json(products);
        } catch (error) {
            console.error('Kategoriye göre ürünler getirilirken hata:', error);
            res.status(500).json({ error: 'Kategoriye göre ürünler getirilirken bir hata oluştu' });
        }
    }
}

module.exports = ProductController;