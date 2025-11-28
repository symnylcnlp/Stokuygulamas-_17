const { Op } = require('sequelize');
const Product = require('../models/Product');
const { generateStockData } = require('../services/stockCodeGenerator');

class ApiError extends Error {
    constructor(message, { status = 500, details } = {}) {
        super(message);
        this.status = status;
        this.details = details;
    }
}

class ApiValidationError extends ApiError {
    constructor(details) {
        const normalized = Array.isArray(details) ? details : [details];
        super('Geçersiz veri', { status: 400, details: normalized });
    }
}

class ApiConflictError extends ApiError {
    constructor(message, details) {
        super(message || 'Çakışma oluştu', { status: 409, details });
    }
}

function parseJsonField(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return value
                .split(/[\n,]/)
                .map(item => item.trim())
                .filter(Boolean);
        }
    }
    return [];
}

function extractColorNames(value) {
    const rawList = parseJsonField(value);
    return Array.from(new Set(
        rawList
            .map(item => {
                if (!item) return '';
                if (typeof item === 'string') return item;
                if (typeof item === 'object') {
                    if (item.name) return item.name;
                    if (item.renk || item.color) return item.renk || item.color;
                    if (item.label) return item.label;
                }
                return '';
            })
            .map(item => item.trim())
            .filter(Boolean)
    ));
}

function sanitizeSizeValue(value) {
    const trimmed = String(value ?? '').trim();
    if (!trimmed) return '';
    return trimmed.replace(/\s*cm$/i, '').trim() || '';
}

function sanitizeSizeList(value) {
    const sizes = parseJsonField(value)
        .map(sanitizeSizeValue)
        .filter(Boolean);
    return Array.from(new Set(sizes));
}

function normalizeBoolean(value, defaultValue = false) {
    if (value === undefined || value === null) return defaultValue;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (!normalized) return defaultValue;
        if (['true', '1', 'yes', 'on', 'evet'].includes(normalized)) return true;
        if (['false', '0', 'no', 'off', 'hayır', 'hayir'].includes(normalized)) return false;
    }
    return defaultValue;
}

function normalizeString(value, fallback = '') {
    if (value === undefined || value === null) return fallback;
    const stringValue = String(value).trim();
    return stringValue || fallback;
}

function parseIntegerField(value) {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Math.trunc(value);
    }
    const parsed = Number.parseInt(String(value).trim(), 10);
    return Number.isNaN(parsed) ? NaN : parsed;
}

function parseDecimalField(value) {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Number(value);
    }
    const parsed = Number.parseFloat(String(value).replace(',', '.'));
    return Number.isNaN(parsed) ? NaN : parsed;
}

function buildNormalizedPayload(body = {}, { existingProduct = null } = {}) {
    const errors = [];
    const payload = {};

    const fallbackData = existingProduct ? existingProduct.get({ plain: true }) : {};
    const isCreate = !existingProduct;

    payload.urunAdi = normalizeString(
        body.urunAdi !== undefined ? body.urunAdi : fallbackData.urunAdi
    );
    if (!payload.urunAdi) {
        errors.push('urunAdi alanı zorunludur');
    }

    payload.kategori = normalizeString(
        body.kategori !== undefined ? body.kategori : fallbackData.kategori
    );
    if (!payload.kategori) {
        errors.push('kategori alanı zorunludur');
    }

    const stokValue = body.stokSayisi !== undefined ? body.stokSayisi : fallbackData.stokSayisi;
    const stokParsed = parseIntegerField(stokValue);
    if (stokParsed === NaN) {
        errors.push('stokSayisi sayı olmalıdır');
    }
    payload.stokSayisi = stokParsed === null
        ? (fallbackData.stokSayisi ?? 0)
        : Math.max(stokParsed, 0);

    const urunFiyatiValue = body.urunFiyati !== undefined ? body.urunFiyati : fallbackData.urunFiyati;
    const urunFiyatiParsed = parseDecimalField(urunFiyatiValue);
    if (urunFiyatiParsed === null) {
        if (isCreate) {
            errors.push('urunFiyati alanı zorunludur');
        }
        payload.urunFiyati = fallbackData.urunFiyati !== undefined ? Number(fallbackData.urunFiyati) : 0;
    } else if (urunFiyatiParsed === NaN) {
        errors.push('urunFiyati sayı olmalıdır');
    } else {
        payload.urunFiyati = urunFiyatiParsed;
    }

    const bayiFiyatiValue = body.bayiFiyati !== undefined ? body.bayiFiyati : fallbackData.bayiFiyati;
    const bayiFiyatiParsed = parseDecimalField(bayiFiyatiValue);
    if (bayiFiyatiParsed === null) {
        if (isCreate) {
            errors.push('bayiFiyati alanı zorunludur');
        }
        payload.bayiFiyati = fallbackData.bayiFiyati !== undefined ? Number(fallbackData.bayiFiyati) : 0;
    } else if (bayiFiyatiParsed === NaN) {
        errors.push('bayiFiyati sayı olmalıdır');
    } else {
        payload.bayiFiyati = bayiFiyatiParsed;
    }

    payload.aciklama = body.aciklama !== undefined
        ? String(body.aciklama)
        : (fallbackData.aciklama ?? '');
    payload.urunDetaylari = body.urunDetaylari !== undefined
        ? String(body.urunDetaylari)
        : (fallbackData.urunDetaylari ?? '');
    payload.oneCikan = normalizeBoolean(body.oneCikan, fallbackData.oneCikan ?? false);

    const renklerRaw = body.renkler !== undefined ? body.renkler : fallbackData.renkler;
    const renkKombinasyonlariRaw = body.renkKombinasyonlari !== undefined ? body.renkKombinasyonlari : fallbackData.renkKombinasyonlari;
    const bedenlerRaw = body.bedenler !== undefined ? body.bedenler : fallbackData.bedenler;

    const renkList = extractColorNames(renklerRaw);
    const renkComboList = extractColorNames(renkKombinasyonlariRaw);
    const bedenList = sanitizeSizeList(bedenlerRaw);

    const stockData = generateStockData({
        urunAdi: payload.urunAdi,
        renkKombinasyonlari: renkComboList.length ? renkComboList : renkList,
        bedenler: bedenList,
        prefix: body.stokKoduOnEki || fallbackData.stokKoduOnEki
    });

    const sanitizedVariants = Array.isArray(stockData.varyantlar)
        ? stockData.varyantlar.map(variant => ({
            ...variant,
            beden: sanitizeSizeValue(variant.beden) || 'STD'
        }))
        : [];

    const sanitizedStockSizes = Array.isArray(stockData.bedenler)
        ? stockData.bedenler
            .map(sanitizeSizeValue)
            .filter(Boolean)
        : [];

    const sanitizedColorCombos = Array.isArray(stockData.kullanilanRenkKombinasyonlari)
        ? stockData.kullanilanRenkKombinasyonlari
            .map(item => String(item || '').trim())
            .filter(Boolean)
        : [];

    payload.varyantlar = sanitizedVariants;
    payload.bedenler = sanitizedStockSizes.length ? sanitizedStockSizes : ['STD'];
    payload.renkKombinasyonlari = sanitizedColorCombos;
    payload.renkler = renkList.length ? renkList : sanitizedColorCombos;

    const requestedCode = normalizeString(
        body.urunKodu !== undefined ? body.urunKodu : fallbackData.urunKodu
    );
    const generatedCode = stockData.anaStokKodu || stockData.baseCode || '';
    payload.urunKodu = requestedCode || generatedCode;
    if (!payload.urunKodu) {
        errors.push('urunKodu üretilemedi');
    }

    if (errors.length) {
        throw new ApiValidationError(errors);
    }

    return payload;
}

function formatProduct(product) {
    const plain = product.get({ plain: true });
    const formatArray = value => (Array.isArray(value) ? value : parseJsonField(value));

    return {
        id: plain.id,
        urunAdi: plain.urunAdi,
        urunKodu: plain.urunKodu,
        kategori: plain.kategori,
        urunFiyati: plain.urunFiyati !== undefined && plain.urunFiyati !== null
            ? Number(plain.urunFiyati)
            : null,
        bayiFiyati: plain.bayiFiyati !== undefined && plain.bayiFiyati !== null
            ? Number(plain.bayiFiyati)
            : null,
        stokSayisi: Number(plain.stokSayisi ?? 0),
        bedenler: formatArray(plain.bedenler),
        renkler: formatArray(plain.renkler),
        renkKombinasyonlari: formatArray(plain.renkKombinasyonlari),
        varyantlar: formatArray(plain.varyantlar),
        oneCikan: !!plain.oneCikan,
        aciklama: plain.aciklama || '',
        urunDetaylari: plain.urunDetaylari || '',
        createdAt: plain.createdAt,
        updatedAt: plain.updatedAt
    };
}

function buildIdentifierWhere(identifier) {
    if (Number.isInteger(Number(identifier))) {
        return { id: Number(identifier) };
    }
    return { urunKodu: identifier };
}

async function findProductByIdentifier(identifier) {
    return Product.findOne({
        where: buildIdentifierWhere(identifier)
    });
}

class ExternalProductController {
    static async list(req, res) {
        try {
            const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
            const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 50, 1), 200);
            const offset = (page - 1) * pageSize;

            const where = {};
            const search = normalizeString(req.query.search);
            if (search) {
                where[Op.or] = [
                    { urunAdi: { [Op.like]: `%${search}%` } },
                    { urunKodu: { [Op.like]: `%${search}%` } }
                ];
            }

            const kategori = normalizeString(req.query.kategori);
            if (kategori) {
                where.kategori = kategori;
            }

            if (req.query.oneCikan !== undefined) {
                where.oneCikan = normalizeBoolean(req.query.oneCikan);
            }

            if (req.query.updatedSince) {
                const sinceDate = new Date(req.query.updatedSince);
                if (!Number.isNaN(sinceDate.getTime())) {
                    where.updatedAt = { [Op.gte]: sinceDate };
                }
            }

            const { rows, count } = await Product.findAndCountAll({
                where,
                limit: pageSize,
                offset,
                order: [['updatedAt', 'DESC']]
            });

            const totalPages = Math.max(1, Math.ceil(count / pageSize));

            res.json({
                meta: {
                    page,
                    pageSize,
                    totalItems: count,
                    totalPages
                },
                data: rows.map(formatProduct)
            });
        } catch (error) {
            console.error('ExternalProductController.list error:', error);
            res.status(500).json({ error: 'Ürün listesi alınırken bir sorun oluştu' });
        }
    }

    static async show(req, res) {
        try {
            const product = await findProductByIdentifier(req.params.idOrCode);
            if (!product) {
                return res.status(404).json({ error: 'Ürün bulunamadı' });
            }
            res.json({ data: formatProduct(product) });
        } catch (error) {
            console.error('ExternalProductController.show error:', error);
            res.status(500).json({ error: 'Ürün bilgisi alınırken bir sorun oluştu' });
        }
    }

    static async create(req, res) {
        try {
            const payload = buildNormalizedPayload(req.body);

            const conflict = await Product.findOne({
                where: { urunKodu: payload.urunKodu }
            });
            if (conflict) {
                throw new ApiConflictError('Ürün kodu zaten kullanımda', ['urunKodu must be unique']);
            }

            const product = await Product.create(payload);
            res.status(201).json({ data: formatProduct(product) });
        } catch (error) {
            if (error instanceof ApiValidationError) {
                return res.status(error.status).json({ error: error.message, details: error.details });
            }
            if (error instanceof ApiConflictError) {
                return res.status(error.status).json({ error: error.message, details: error.details });
            }
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({
                    error: 'Geçersiz veri girişi',
                    details: error.errors.map(e => e.message)
                });
            }
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(409).json({
                    error: 'Ürün kodu zaten kullanımda',
                    details: error.errors.map(e => e.message)
                });
            }
            console.error('ExternalProductController.create error:', error);
            res.status(500).json({ error: 'Ürün oluşturulurken bir sorun oluştu' });
        }
    }

    static async update(req, res) {
        try {
            const product = await findProductByIdentifier(req.params.idOrCode);
            if (!product) {
                return res.status(404).json({ error: 'Ürün bulunamadı' });
            }

            const payload = buildNormalizedPayload(req.body, { existingProduct: product });

            if (payload.urunKodu !== product.urunKodu) {
                const conflict = await Product.findOne({
                    where: {
                        urunKodu: payload.urunKodu,
                        id: { [Op.ne]: product.id }
                    }
                });
                if (conflict) {
                    throw new ApiConflictError('Ürün kodu zaten kullanımda', ['urunKodu must be unique']);
                }
            }

            await product.update(payload);
            await product.reload();
            res.json({ data: formatProduct(product) });
        } catch (error) {
            if (error instanceof ApiValidationError) {
                return res.status(error.status).json({ error: error.message, details: error.details });
            }
            if (error instanceof ApiConflictError) {
                return res.status(error.status).json({ error: error.message, details: error.details });
            }
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({
                    error: 'Geçersiz veri girişi',
                    details: error.errors.map(e => e.message)
                });
            }
            console.error('ExternalProductController.update error:', error);
            res.status(500).json({ error: 'Ürün güncellenirken bir sorun oluştu' });
        }
    }

    static async destroy(req, res) {
        try {
            const product = await findProductByIdentifier(req.params.idOrCode);
            if (!product) {
                return res.status(404).json({ error: 'Ürün bulunamadı' });
            }
            await product.destroy();
            res.status(204).send();
        } catch (error) {
            console.error('ExternalProductController.destroy error:', error);
            res.status(500).json({ error: 'Ürün silinirken bir sorun oluştu' });
        }
    }
}

module.exports = ExternalProductController;


