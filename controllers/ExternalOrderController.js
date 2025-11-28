const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Order = require('../models/Order');
const Product = require('../models/Product');

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

function parseInteger(value, { min, allowNull = false } = {}) {
    if (value === undefined || value === null || value === '') {
        return allowNull ? null : 0;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Math.trunc(value);
    }
    const parsed = Number.parseInt(String(value).trim(), 10);
    if (Number.isNaN(parsed)) {
        return NaN;
    }
    if (typeof min === 'number' && parsed < min) {
        return min;
    }
    return parsed;
}

function parseDecimal(value, { allowNull = false } = {}) {
    if (value === undefined || value === null || value === '') {
        return allowNull ? null : 0;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Number(value);
    }
    const parsed = Number.parseFloat(String(value).replace(',', '.'));
    return Number.isNaN(parsed) ? NaN : parsed;
}

function parseItems(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }
    return [];
}

function generateOrderNumber(prefix = 'ORD') {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `${prefix}-${timestamp}-${random}`;
}

async function ensureOrderNumberUnique(orderNumber, transaction) {
    const existing = await Order.findOne({
        where: { orderNumber },
        transaction,
        lock: transaction.LOCK.UPDATE
    });
    if (existing) {
        throw new ApiConflictError('Sipariş numarası kullanımda', ['orderNumber must be unique']);
    }
}

function formatOrder(order) {
    const plain = order.get({ plain: true });
    return {
        id: plain.id,
        orderNumber: plain.orderNumber,
        status: plain.status,
        dealerName: plain.dealerName,
        dealerCode: plain.dealerCode,
        contactName: plain.contactName,
        contactEmail: plain.contactEmail,
        contactPhone: plain.contactPhone,
        totalQuantity: Number(plain.totalQuantity ?? 0),
        totalAmount: plain.totalAmount !== undefined && plain.totalAmount !== null
            ? Number(plain.totalAmount)
            : 0,
        currency: plain.currency || 'TRY',
        items: Array.isArray(plain.items) ? plain.items : [],
        notes: plain.notes || '',
        externalMetadata: plain.externalMetadata || {},
        createdAt: plain.createdAt,
        updatedAt: plain.updatedAt
    };
}

function buildIdentifierWhere(identifier) {
    if (Number.isInteger(Number(identifier))) {
        return { id: Number(identifier) };
    }
    return { orderNumber: identifier };
}

async function findOrderByIdentifier(identifier) {
    return Order.findOne({
        where: buildIdentifierWhere(identifier)
    });
}

async function buildOrderPayload(body, { transaction, existingOrder = null }) {
    const errors = [];
    const payload = {};
    const isCreate = !existingOrder;
    const baseData = existingOrder ? existingOrder.get({ plain: true }) : {};

    payload.dealerName = normalizeString(
        body.dealerName !== undefined ? body.dealerName : baseData.dealerName
    );
    payload.dealerCode = normalizeString(
        body.dealerCode !== undefined ? body.dealerCode : baseData.dealerCode
    );
    payload.contactName = normalizeString(
        body.contactName !== undefined ? body.contactName : baseData.contactName
    );
    payload.contactEmail = normalizeEmail(
        body.contactEmail !== undefined ? body.contactEmail : baseData.contactEmail
    );
    payload.contactPhone = normalizeString(
        body.contactPhone !== undefined ? body.contactPhone : baseData.contactPhone
    );
    payload.notes = body.notes !== undefined ? String(body.notes) : (baseData.notes ?? '');
    payload.externalMetadata = body.externalMetadata !== undefined
        ? body.externalMetadata
        : (baseData.externalMetadata ?? null);
    payload.currency = normalizeString(
        body.currency !== undefined ? body.currency : baseData.currency || 'TRY'
    ) || 'TRY';

    if (payload.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.contactEmail)) {
        errors.push('contactEmail geçerli bir e-posta olmalıdır');
    }

    let itemsInput = body.items !== undefined ? body.items : baseData.items;
    const items = parseItems(itemsInput);

    if (isCreate && (!items || !items.length)) {
        errors.push('items alanı en az bir ürün içermelidir');
    }

    if (errors.length) {
        throw new ApiValidationError(errors);
    }

    if (!isCreate) {
        payload.items = baseData.items;
        payload.totalAmount = baseData.totalAmount;
        payload.totalQuantity = baseData.totalQuantity;
        return payload;
    }

    const preparedItems = [];
    let totalQuantity = 0;
    let totalAmount = 0;

    for (const rawItem of items) {
        const productCode = normalizeString(rawItem.productCode || rawItem.urunKodu);
        if (!productCode) {
            throw new ApiValidationError('Her sipariş kalemi productCode içermelidir');
        }

        const quantityValue = rawItem.quantity ?? rawItem.adet ?? rawItem.qty;
        const quantity = parseInteger(quantityValue, { min: 1 });
        if (Number.isNaN(quantity) || quantity <= 0) {
            throw new ApiValidationError(`'${productCode}' kalemi için quantity geçersiz`);
        }

        const product = await Product.findOne({
            where: { urunKodu: productCode },
            transaction,
            lock: transaction.LOCK.UPDATE
        });
        if (!product) {
            throw new ApiValidationError(`'${productCode}' ürün kodu bulunamadı`);
        }

        if (product.stokSayisi < quantity) {
            throw new ApiValidationError(`'${productCode}' ürünü için yeterli stok yok`);
        }

        const unitPriceInput = rawItem.unitPrice ?? rawItem.price ?? rawItem.unit_price;
        let unitPrice = parseDecimal(unitPriceInput, { allowNull: true });
        if (unitPrice === null || Number.isNaN(unitPrice)) {
            const fallback = Number(product.bayiFiyati ?? product.urunFiyati ?? 0);
            unitPrice = Number.isFinite(fallback) ? fallback : 0;
        }

        const discountInput = rawItem.discount ?? rawItem.indirimOrani ?? rawItem.discountRate;
        let discountRate = parseDecimal(discountInput, { allowNull: true });
        if (Number.isNaN(discountRate)) {
            discountRate = null;
        }

        const appliedUnitPrice = discountRate && discountRate > 0
            ? unitPrice * (1 - discountRate / 100)
            : unitPrice;

        const lineTotal = appliedUnitPrice * quantity;

        preparedItems.push({
            productId: product.id,
            productCode,
            productName: product.urunAdi,
            quantity,
            unitPrice: Number(appliedUnitPrice.toFixed(2)),
            currency: payload.currency,
            subtotal: Number(lineTotal.toFixed(2)),
            requested: {
                size: normalizeString(rawItem.size || rawItem.beden),
                color: normalizeString(rawItem.color || rawItem.renk),
                discountRate: discountRate && discountRate > 0 ? Number(discountRate) : null
            }
        });

        totalQuantity += quantity;
        totalAmount += lineTotal;

        product.stokSayisi = Math.max(product.stokSayisi - quantity, 0);
        await product.save({ transaction });
    }

    payload.items = preparedItems;
    payload.totalQuantity = totalQuantity;
    payload.totalAmount = Number(totalAmount.toFixed(2));

    return payload;
}

class ExternalOrderController {
    static async list(req, res) {
        try {
            const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
            const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 50, 1), 200);
            const offset = (page - 1) * pageSize;

            const where = {};

            const search = normalizeString(req.query.search);
            if (search) {
                where[Op.or] = [
                    { orderNumber: { [Op.like]: `%${search}%` } },
                    { dealerName: { [Op.like]: `%${search}%` } },
                    { dealerCode: { [Op.like]: `%${search}%` } }
                ];
            }

            const status = normalizeString(req.query.status);
            if (status) {
                where.status = status;
            }

            const dealerCode = normalizeString(req.query.dealerCode);
            if (dealerCode) {
                where.dealerCode = dealerCode;
            }

            if (req.query.createdSince) {
                const since = new Date(req.query.createdSince);
                if (!Number.isNaN(since.getTime())) {
                    where.createdAt = { [Op.gte]: since };
                }
            }

            const { rows, count } = await Order.findAndCountAll({
                where,
                limit: pageSize,
                offset,
                order: [['createdAt', 'DESC']]
            });

            const totalPages = Math.max(1, Math.ceil(count / pageSize));

            res.json({
                meta: {
                    page,
                    pageSize,
                    totalItems: count,
                    totalPages
                },
                data: rows.map(formatOrder)
            });
        } catch (error) {
            console.error('ExternalOrderController.list error:', error);
            res.status(500).json({ error: 'Sipariş listesi alınırken bir hata oluştu' });
        }
    }

    static async show(req, res) {
        try {
            const order = await findOrderByIdentifier(req.params.idOrCode);
            if (!order) {
                throw new ApiNotFoundError('Sipariş bulunamadı');
            }
            res.json({ data: formatOrder(order) });
        } catch (error) {
            if (error instanceof ApiError) {
                return res.status(error.status).json({ error: error.message, details: error.details });
            }
            console.error('ExternalOrderController.show error:', error);
            res.status(500).json({ error: 'Sipariş bilgisi alınırken bir hata oluştu' });
        }
    }

    static async create(req, res) {
        const transaction = await sequelize.transaction();
        try {
            let orderNumber = normalizeString(req.body.orderNumber);
            if (!orderNumber) {
                orderNumber = generateOrderNumber(req.body.dealerCode || 'ORD');
            }

            await ensureOrderNumberUnique(orderNumber, transaction);

            const payload = await buildOrderPayload(req.body, { transaction });
            payload.orderNumber = orderNumber;
            payload.status = normalizeString(req.body.status, 'pending') || 'pending';

            const order = await Order.create(payload, { transaction });
            await transaction.commit();

            res.status(201).json({ data: formatOrder(order) });
        } catch (error) {
            await transaction.rollback();
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
                    error: 'Sipariş numarası kullanımda',
                    details: error.errors.map(e => e.message)
                });
            }
            console.error('ExternalOrderController.create error:', error);
            res.status(500).json({ error: 'Sipariş oluşturulurken bir hata oluştu' });
        }
    }

    static async update(req, res) {
        const transaction = await sequelize.transaction();
        try {
            const order = await findOrderByIdentifier(req.params.idOrCode);
            if (!order) {
                throw new ApiNotFoundError('Sipariş bulunamadı');
            }

            if (req.body.orderNumber && req.body.orderNumber !== order.orderNumber) {
                await ensureOrderNumberUnique(req.body.orderNumber, transaction);
            }

            const payload = await buildOrderPayload(req.body, { transaction, existingOrder: order });

            const nextStatus = normalizeString(req.body.status, order.status);
            payload.status = nextStatus || order.status;
            if (req.body.orderNumber) {
                payload.orderNumber = normalizeString(req.body.orderNumber, order.orderNumber);
            }

            await order.update(payload, { transaction });
            await transaction.commit();
            await order.reload();

            res.json({ data: formatOrder(order) });
        } catch (error) {
            await transaction.rollback();
            if (error instanceof ApiError) {
                return res.status(error.status).json({ error: error.message, details: error.details });
            }
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({
                    error: 'Geçersiz veri',
                    details: error.errors.map(e => e.message)
                });
            }
            console.error('ExternalOrderController.update error:', error);
            res.status(500).json({ error: 'Sipariş güncellenirken bir hata oluştu' });
        }
    }

    static async destroy(req, res) {
        const transaction = await sequelize.transaction();
        try {
            const order = await findOrderByIdentifier(req.params.idOrCode);
            if (!order) {
                throw new ApiNotFoundError('Sipariş bulunamadı');
            }

            const items = Array.isArray(order.items) ? order.items : [];
            for (const item of items) {
                if (!item || !item.productCode || !item.quantity) continue;
                const product = await Product.findOne({
                    where: { urunKodu: item.productCode },
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });
                if (!product) continue;
                const qty = Number(item.quantity) || 0;
                product.stokSayisi = Math.max(product.stokSayisi + qty, 0);
                await product.save({ transaction });
            }

            await order.destroy({ transaction });
            await transaction.commit();
            res.status(204).send();
        } catch (error) {
            await transaction.rollback();
            if (error instanceof ApiError) {
                return res.status(error.status).json({ error: error.message, details: error.details });
            }
            console.error('ExternalOrderController.destroy error:', error);
            res.status(500).json({ error: 'Sipariş silinirken bir hata oluştu' });
        }
    }
}

module.exports = ExternalOrderController;


