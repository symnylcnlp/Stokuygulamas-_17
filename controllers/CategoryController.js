const Category = require('../models/Category');

function normalizeBoolean(value, defaultValue = true) {
    if (value === undefined || value === null) {
        return defaultValue;
    }
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (!normalized) return defaultValue;
        if (['true', '1', 'on', 'yes', 'aktif'].includes(normalized)) return true;
        if (['false', '0', 'off', 'no', 'pasif'].includes(normalized)) return false;
    }
    return defaultValue;
}

function parseList(input) {
    if (!input) return [];
    if (Array.isArray(input)) {
        return input
            .map(item => String(item ?? '').trim())
            .filter(Boolean);
    }
    if (typeof input === 'string') {
        return input
            .split(/[,\n\r]+/)
            .map(item => item.trim())
            .filter(Boolean);
    }
    return [];
}

function normalizeSubcategories(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) {
        return raw
            .map(item => String(item ?? '').trim())
            .filter(Boolean);
    }
    if (typeof raw === 'object') {
        return Object.values(raw)
            .map(item => String(item ?? '').trim())
            .filter(Boolean);
    }
    return parseList(raw);
}

function hasSubcategoryPayload(body = {}) {
    return body.subcategories !== undefined ||
        body.subcategoryList !== undefined ||
        body.children !== undefined ||
        body.items !== undefined;
}

function serializeCategory(category) {
    const plain = category.toJSON();
    plain.subcategories = normalizeSubcategories(plain.subcategories);
    plain.isActive = normalizeBoolean(plain.isActive, true);
    return plain;
}

function prepareCategoryPayload(body = {}, currentCategory) {
    const payload = {};

    const resolvedName = typeof body.name === 'string'
        ? body.name.trim()
        : (currentCategory?.name ?? '').trim();

    if (!resolvedName) {
        throw new Error('Kategori adı zorunludur');
    }

    payload.name = resolvedName;

    if (hasSubcategoryPayload(body)) {
        const data = body.subcategories ?? body.subcategoryList ?? body.children ?? body.items;
        payload.subcategories = normalizeSubcategories(data);
    } else if (!currentCategory) {
        payload.subcategories = [];
    }

    const desiredActive = normalizeBoolean(body.isActive, currentCategory?.isActive ?? true);
    if (body.isActive !== undefined || !currentCategory) {
        payload.isActive = desiredActive;
    }

    return payload;
}

class CategoryController {
    static async getAllCategories(req, res) {
        try {
            const includeInactive = req.query.includeInactive === 'true';
            const categories = await Category.findAll({
                where: includeInactive ? {} : { isActive: true },
                order: [['updatedAt', 'DESC']]
            });
            res.json(categories.map(serializeCategory));
        } catch (error) {
            res.status(500).json({ error: 'Kategoriler getirilirken bir hata oluştu' });
        }
    }

    static async getCategoryById(req, res) {
        try {
            const category = await Category.findByPk(req.params.id);
            if (!category) {
                return res.status(404).json({ error: 'Kategori bulunamadı' });
            }
            res.json(serializeCategory(category));
        } catch (error) {
            res.status(500).json({ error: 'Kategori getirilirken bir hata oluştu' });
        }
    }

    static async createCategory(req, res) {
        try {
            const payload = prepareCategoryPayload(req.body);
            const category = await Category.create(payload);
            res.status(201).json(serializeCategory(category));
        } catch (error) {
            res.status(400).json({
                error: 'Kategori oluşturulurken bir hata oluştu',
                details: error.message
            });
        }
    }

    static async updateCategory(req, res) {
        try {
            const category = await Category.findByPk(req.params.id);
            if (!category) {
                return res.status(404).json({ error: 'Kategori bulunamadı' });
            }
            const payload = prepareCategoryPayload(req.body, category);
            if (!Object.keys(payload).length) {
                return res.json(serializeCategory(category));
            }
            await category.update(payload);
            await category.reload();
            res.json(serializeCategory(category));
        } catch (error) {
            res.status(400).json({
                error: 'Kategori güncellenirken bir hata oluştu',
                details: error.message
            });
        }
    }

    static async deleteCategory(req, res) {
        try {
            const category = await Category.findByPk(req.params.id);
            if (!category) {
                return res.status(404).json({ error: 'Kategori bulunamadı' });
            }
            await category.destroy();
            res.json({ message: 'Kategori silindi' });
        } catch (error) {
            res.status(500).json({ error: 'Kategori silinirken bir hata oluştu' });
        }
    }
}

module.exports = CategoryController;
