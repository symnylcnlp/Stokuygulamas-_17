const { Op } = require('sequelize');
const Dealer = require('../models/Dealer');
const Order = require('../models/Order');

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

class ApiNotFoundError extends ApiError {
    constructor(message) {
        super(message || 'Kayıt bulunamadı', { status: 404 });
    }
}

function normalizeString(value, fallback = '') {
    if (value === undefined || value === null) return fallback;
    const text = String(value).trim();
    return text || fallback;
}

function normalizeEmail(value) {
    const email = normalizeString(value);
    if (!email) return '';
    return email.toLowerCase();
}

function normalizeBoolean(value, defaultValue = true) {
    if (value === undefined || value === null) return defaultValue;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (!normalized) return defaultValue;
        if (['true', '1', 'yes', 'on', 'aktif'].includes(normalized)) return true;
        if (['false', '0', 'no', 'off', 'pasif'].includes(normalized)) return false;
    }
    return defaultValue;
}

function formatDealer(dealer, { includeOrdersSummary = false, ordersSummary = null } = {}) {
    const plain = dealer.get({ plain: true });
    const payload = {
        id: plain.id,
        code: plain.code,
        name: plain.name,
        contactName: plain.contactName,
        contactEmail: plain.contactEmail,
        contactPhone: plain.contactPhone,
        address: plain.address,
        city: plain.city,
        district: plain.district,
        country: plain.country,
        establishmentYear: plain.establishmentYear,
        website: plain.website,
        taxNumber: plain.taxNumber,
        taxOffice: plain.taxOffice,
        taxCertificatePath: plain.taxCertificatePath,
        tradeRegistryGazettePath: plain.tradeRegistryGazettePath,
        signatureCircularPath: plain.signatureCircularPath,
        status: plain.status,
        notes: plain.notes,
        isActive: !!plain.isActive,
        externalMetadata: plain.externalMetadata || {},
        createdAt: plain.createdAt,
        updatedAt: plain.updatedAt
    };

    if (includeOrdersSummary && ordersSummary) {
        payload.ordersSummary = ordersSummary;
    }

    return payload;
}

function buildIdentifierWhere(identifier) {
    if (Number.isInteger(Number(identifier))) {
        return { id: Number(identifier) };
    }
    return { code: identifier };
}

async function findDealerByIdentifier(identifier) {
    return Dealer.findOne({
        where: buildIdentifierWhere(identifier)
    });
}

function buildDealerPayload(body, { existingDealer = null } = {}) {
    const errors = [];
    const payload = {};
    const baseData = existingDealer ? existingDealer.get({ plain: true }) : {};
    const isCreate = !existingDealer;

    payload.code = normalizeString(
        body.code !== undefined ? body.code : baseData.code
    );
    if (!payload.code) {
        errors.push('code alanı zorunludur');
    }

    payload.name = normalizeString(
        body.name !== undefined ? body.name : baseData.name
    );
    if (!payload.name) {
        errors.push('name alanı zorunludur');
    }

    payload.contactName = normalizeString(
        body.contactName !== undefined ? body.contactName : baseData.contactName
    );
    payload.contactEmail = normalizeEmail(
        body.contactEmail !== undefined ? body.contactEmail : baseData.contactEmail
    );
    payload.contactPhone = normalizeString(
        body.contactPhone !== undefined ? body.contactPhone : baseData.contactPhone
    );
    payload.address = body.address !== undefined ? String(body.address) : (baseData.address ?? '');
    payload.city = normalizeString(
        body.city !== undefined ? body.city : baseData.city
    );
    payload.district = normalizeString(
        body.district !== undefined ? body.district : baseData.district
    );
    payload.country = normalizeString(
        body.country !== undefined ? body.country : baseData.country || 'Türkiye'
    ) || 'Türkiye';
    // Kuruluş yılı
    if (body.establishmentYear !== undefined) {
        const year = parseInt(String(body.establishmentYear).trim(), 10);
        payload.establishmentYear = Number.isNaN(year) ? baseData.establishmentYear ?? null : year;
    } else {
        payload.establishmentYear = baseData.establishmentYear ?? null;
    }
    // Web sitesi
    payload.website = normalizeString(
        body.website !== undefined ? body.website : baseData.website
    );
    payload.taxNumber = normalizeString(
        body.taxNumber !== undefined ? body.taxNumber : baseData.taxNumber
    );
    payload.taxOffice = normalizeString(
        body.taxOffice !== undefined ? body.taxOffice : baseData.taxOffice
    );
    // Belgeler (dosya yolları, upload endpoint'leri bunları dolduracak)
    payload.taxCertificatePath = body.taxCertificatePath !== undefined
        ? normalizeString(body.taxCertificatePath)
        : (baseData.taxCertificatePath ?? null);
    payload.tradeRegistryGazettePath = body.tradeRegistryGazettePath !== undefined
        ? normalizeString(body.tradeRegistryGazettePath)
        : (baseData.tradeRegistryGazettePath ?? null);
    payload.signatureCircularPath = body.signatureCircularPath !== undefined
        ? normalizeString(body.signatureCircularPath)
        : (baseData.signatureCircularPath ?? null);
    payload.notes = body.notes !== undefined ? String(body.notes) : (baseData.notes ?? '');
    payload.externalMetadata = body.externalMetadata !== undefined
        ? body.externalMetadata
        : (baseData.externalMetadata ?? null);
    payload.isActive = normalizeBoolean(
        body.isActive !== undefined ? body.isActive : baseData.isActive,
        baseData.isActive ?? true
    );

    if (payload.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.contactEmail)) {
        errors.push('contactEmail geçerli bir e-posta olmalıdır');
    }

    if (errors.length) {
        throw new ApiValidationError(errors);
    }

    return payload;
}

async function buildOrdersSummaryForDealerCode(code) {
    if (!code) {
        return {
            totalOrders: 0,
            totalAmount: 0,
            totalQuantity: 0,
            lastOrderAt: null
        };
    }

    const orders = await Order.findAll({
        where: { dealerCode: code },
        attributes: ['id', 'totalAmount', 'totalQuantity', 'createdAt'],
        order: [['createdAt', 'DESC']]
    });

    if (!orders.length) {
        return {
            totalOrders: 0,
            totalAmount: 0,
            totalQuantity: 0,
            lastOrderAt: null
        };
    }

    let totalAmount = 0;
    let totalQuantity = 0;
    orders.forEach(o => {
        totalAmount += Number(o.totalAmount || 0);
        totalQuantity += Number(o.totalQuantity || 0);
    });

    return {
        totalOrders: orders.length,
        totalAmount: Number(totalAmount.toFixed(2)),
        totalQuantity,
        lastOrderAt: orders[0].createdAt
    };
}

class ExternalDealerController {
    static async list(req, res) {
        try {
            const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
            const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 50, 1), 200);
            const offset = (page - 1) * pageSize;

            const where = {};

            const search = normalizeString(req.query.search);
            if (search) {
                where[Op.or] = [
                    { code: { [Op.like]: `%${search}%` } },
                    { name: { [Op.like]: `%${search}%` } },
                    { contactName: { [Op.like]: `%${search}%` } }
                ];
            }

            if (req.query.isActive !== undefined) {
                where.isActive = normalizeBoolean(req.query.isActive, true);
            }

            const statusParam = normalizeString(req.query.status);
            if (statusParam) {
                where.status = statusParam;
            }

            const { rows, count } = await Dealer.findAndCountAll({
                where,
                limit: pageSize,
                offset,
                order: [['name', 'ASC']]
            });

            const totalPages = Math.max(1, Math.ceil(count / pageSize));

            const includeSummary = req.query.includeOrdersSummary === 'true';
            let summariesByCode = {};

            if (includeSummary) {
                const codes = rows.map(d => d.code).filter(Boolean);
                summariesByCode = {};
                for (const code of codes) {
                    summariesByCode[code] = await buildOrdersSummaryForDealerCode(code);
                }
            }

            res.json({
                meta: {
                    page,
                    pageSize,
                    totalItems: count,
                    totalPages
                },
                data: rows.map(d =>
                    formatDealer(
                        d,
                        {
                            includeOrdersSummary: includeSummary,
                            ordersSummary: includeSummary ? summariesByCode[d.code] : null
                        }
                    )
                )
            });
        } catch (error) {
            console.error('ExternalDealerController.list error:', error);
            res.status(500).json({ error: 'Bayiler alınırken bir hata oluştu' });
        }
    }

    static async show(req, res) {
        try {
            const dealer = await findDealerByIdentifier(req.params.idOrCode);
            if (!dealer) {
                throw new ApiNotFoundError('Bayi bulunamadı');
            }

            const includeSummary = req.query.includeOrdersSummary === 'true';
            let summary = null;
            if (includeSummary) {
                summary = await buildOrdersSummaryForDealerCode(dealer.code);
            }

            res.json({
                data: formatDealer(dealer, {
                    includeOrdersSummary: includeSummary,
                    ordersSummary: summary
                })
            });
        } catch (error) {
            if (error instanceof ApiError) {
                return res.status(error.status).json({ error: error.message, details: error.details });
            }
            console.error('ExternalDealerController.show error:', error);
            res.status(500).json({ error: 'Bayi bilgisi alınırken bir hata oluştu' });
        }
    }

    static async create(req, res) {
        try {
            const payload = buildDealerPayload(req.body);

            // Başvuru sistemi: dış başvurular HER ZAMAN beklemede ve pasif başlar
            payload.status = 'pending';
            payload.isActive = false;

            const conflict = await Dealer.findOne({
                where: { code: payload.code }
            });
            if (conflict) {
                throw new ApiConflictError('Bayi kodu kullanımda', ['code must be unique']);
            }

            const dealer = await Dealer.create(payload);
            res.status(201).json({ data: formatDealer(dealer) });
        } catch (error) {
            if (error instanceof ApiError) {
                return res.status(error.status).json({ error: error.message, details: error.details });
            }
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({
                    error: 'Geçersiz veri',
                    details: error.errors.map(e => e.message)
                });
            }
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(409).json({
                    error: 'Bayi kodu kullanımda',
                    details: error.errors.map(e => e.message)
                });
            }
            console.error('ExternalDealerController.create error:', error);
            res.status(500).json({ error: 'Bayi oluşturulurken bir hata oluştu' });
        }
    }

    static async update(req, res) {
        try {
            const dealer = await findDealerByIdentifier(req.params.idOrCode);
            if (!dealer) {
                throw new ApiNotFoundError('Bayi bulunamadı');
            }

            const payload = buildDealerPayload(req.body, { existingDealer: dealer });

            if (payload.code !== dealer.code) {
                const conflict = await Dealer.findOne({
                    where: {
                        code: payload.code,
                        id: { [Op.ne]: dealer.id }
                    }
                });
                if (conflict) {
                    throw new ApiConflictError('Bayi kodu kullanımda', ['code must be unique']);
                }
            }

            // Admin onayı için durum güncellemesi (approved / rejected) desteklenir
            if (req.body.status) {
                const nextStatus = String(req.body.status).trim().toLowerCase();
                if (['pending', 'approved', 'rejected'].includes(nextStatus)) {
                    payload.status = nextStatus;
                }
            }

            await dealer.update(payload);
            await dealer.reload();

            res.json({ data: formatDealer(dealer) });
        } catch (error) {
            if (error instanceof ApiError) {
                return res.status(error.status).json({ error: error.message, details: error.details });
            }
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({
                    error: 'Geçersiz veri',
                    details: error.errors.map(e => e.message)
                });
            }
            console.error('ExternalDealerController.update error:', error);
            res.status(500).json({ error: 'Bayi güncellenirken bir hata oluştu' });
        }
    }

    static async destroy(req, res) {
        try {
            const dealer = await findDealerByIdentifier(req.params.idOrCode);
            if (!dealer) {
                throw new ApiNotFoundError('Bayi bulunamadı');
            }

            const hasOrders = await Order.count({
                where: { dealerCode: dealer.code }
            });
            if (hasOrders > 0) {
                throw new ApiConflictError('Bu bayiye ait siparişler var, silinemez', [
                    'Dealer has related orders'
                ]);
            }

            await dealer.destroy();
            res.status(204).send();
        } catch (error) {
            if (error instanceof ApiError) {
                return res.status(error.status).json({ error: error.message, details: error.details });
            }
            console.error('ExternalDealerController.destroy error:', error);
            res.status(500).json({ error: 'Bayi silinirken bir hata oluştu' });
        }
    }

    static async uploadTaxCertificate(req, res) {
        try {
            const dealer = await findDealerByIdentifier(req.params.idOrCode);
            if (!dealer) {
                throw new ApiNotFoundError('Bayi bulunamadı');
            }
            if (!req.file) {
                throw new ApiValidationError('PDF dosyası zorunludur');
            }
            const relativePath = `/uploads/dealers/${req.file.filename}`;
            await dealer.update({ taxCertificatePath: relativePath });
            res.status(200).json({
                data: {
                    path: relativePath
                }
            });
        } catch (error) {
            if (error instanceof ApiError) {
                return res.status(error.status).json({ error: error.message, details: error.details });
            }
            console.error('uploadTaxCertificate error:', error);
            res.status(500).json({ error: 'Vergi levhası yüklenirken hata oluştu' });
        }
    }

    static async uploadTradeRegistryGazette(req, res) {
        try {
            const dealer = await findDealerByIdentifier(req.params.idOrCode);
            if (!dealer) {
                throw new ApiNotFoundError('Bayi bulunamadı');
            }
            if (!req.file) {
                throw new ApiValidationError('PDF dosyası zorunludur');
            }
            const relativePath = `/uploads/dealers/${req.file.filename}`;
            await dealer.update({ tradeRegistryGazettePath: relativePath });
            res.status(200).json({
                data: {
                    path: relativePath
                }
            });
        } catch (error) {
            if (error instanceof ApiError) {
                return res.status(error.status).json({ error: error.message, details: error.details });
            }
            console.error('uploadTradeRegistryGazette error:', error);
            res.status(500).json({ error: 'Ticaret sicil gazetesi yüklenirken hata oluştu' });
        }
    }

    static async uploadSignatureCircular(req, res) {
        try {
            const dealer = await findDealerByIdentifier(req.params.idOrCode);
            if (!dealer) {
                throw new ApiNotFoundError('Bayi bulunamadı');
            }
            if (!req.file) {
                throw new ApiValidationError('PDF dosyası zorunludur');
            }
            const relativePath = `/uploads/dealers/${req.file.filename}`;
            await dealer.update({ signatureCircularPath: relativePath });
            res.status(200).json({
                data: {
                    path: relativePath
                }
            });
        } catch (error) {
            if (error instanceof ApiError) {
                return res.status(error.status).json({ error: error.message, details: error.details });
            }
            console.error('uploadSignatureCircular error:', error);
            res.status(500).json({ error: 'İmza sirküleri yüklenirken hata oluştu' });
        }
    }
}

module.exports = ExternalDealerController;


