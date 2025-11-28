const SizeGuide = require('../models/SizeGuide');

function pickFirstInputValue(body) {
    if (!body) return undefined;
    const candidates = [body.value, body.name];

    for (const candidate of candidates) {
        if (candidate === undefined || candidate === null) continue;

        if (Array.isArray(candidate)) {
            const firstNonEmpty = candidate.find(item => item !== undefined && item !== null && String(item).trim());
            if (firstNonEmpty !== undefined) {
                return String(firstNonEmpty);
            }
            continue;
        }

        return String(candidate);
    }

    return undefined;
}

function parseBoolean(input, defaultValue) {
    if (input === undefined || input === null) return defaultValue;
    if (typeof input === 'boolean') return input;
    if (typeof input === 'number') return input !== 0;
    if (typeof input === 'string') {
        const normalized = input.trim().toLowerCase();
        if (!normalized) return defaultValue;
        if (['true', '1', 'on', 'yes', 'aktif'].includes(normalized)) return true;
        if (['false', '0', 'off', 'no', 'pasif'].includes(normalized)) return false;
    }
    return defaultValue;
}

class SizeGuideController {
    static async getAll(req, res) {
        try {
            const includeInactive = req.query.includeInactive === 'true';
            const pageParam = req.query.page;
            const pageSizeParam = req.query.pageSize;
            const usePagination = pageParam !== undefined || pageSizeParam !== undefined;
            const baseWhere = includeInactive ? {} : { isActive: true };

            if (usePagination) {
                const page = Math.max(parseInt(pageParam, 10) || 1, 1);
                const pageSize = Math.min(Math.max(parseInt(pageSizeParam, 10) || 20, 1), 100);
                const offset = (page - 1) * pageSize;

                const { rows, count } = await SizeGuide.findAndCountAll({
                    where: baseWhere,
                    order: [['updatedAt', 'DESC']],
                    limit: pageSize,
                    offset
                });

                const totalPages = Math.max(1, Math.ceil(count / pageSize));

                res.json({
                    items: rows,
                    totalItems: count,
                    totalPages,
                    currentPage: Math.min(page, totalPages),
                    pageSize
                });
                return;
            }

            const guides = await SizeGuide.findAll({
                where: baseWhere,
                order: [['updatedAt', 'DESC']]
            });
            res.json(guides);
        } catch (error) {
            res.status(500).json({ error: 'Beden kayıtları getirilirken bir hata oluştu' });
        }
    }

    static async getById(req, res) {
        try {
            const guide = await SizeGuide.findByPk(req.params.id);
            if (!guide) {
                return res.status(404).json({ error: 'Beden kaydı bulunamadı' });
            }
            res.json(guide);
        } catch (error) {
            res.status(500).json({ error: 'Beden kaydı getirilirken bir hata oluştu' });
        }
    }

    static async create(req, res) {
        try {
            const payload = SizeGuideController.preparePayload(req.body);
            const guide = await SizeGuide.create(payload);
            res.status(201).json(guide);
        } catch (error) {
            res.status(400).json({
                error: 'Beden kaydı oluşturulurken bir hata oluştu',
                details: error.message
            });
        }
    }

    static async update(req, res) {
        try {
            const guide = await SizeGuide.findByPk(req.params.id);
            if (!guide) {
                return res.status(404).json({ error: 'Beden kaydı bulunamadı' });
            }
            const payload = SizeGuideController.preparePayload(req.body, guide);
            if (!Object.keys(payload).length) {
                return res.json(guide);
            }
            await guide.update(payload);
            await guide.reload();
            res.json(guide);
        } catch (error) {
            res.status(400).json({
                error: 'Beden kaydı güncellenirken bir hata oluştu',
                details: error.message
            });
        }
    }

    static async remove(req, res) {
        try {
            const guide = await SizeGuide.findByPk(req.params.id);
            if (!guide) {
                return res.status(404).json({ error: 'Beden kaydı bulunamadı' });
            }
            await guide.destroy();
            res.json({ message: 'Beden kaydı silindi' });
        } catch (error) {
            res.status(500).json({ error: 'Beden kaydı silinirken bir hata oluştu' });
        }
    }

    static preparePayload(body = {}, currentGuide) {
        const payload = {};

        const rawValue = pickFirstInputValue(body);
        const hasIncomingValue = rawValue !== undefined;

        if (hasIncomingValue) {
            const trimmed = rawValue.trim();
            if (!trimmed) {
                throw new Error('Beden değeri zorunludur');
            }
            payload.name = trimmed;
        } else if (!currentGuide) {
            throw new Error('Beden değeri zorunludur');
        }

        const desiredActive = parseBoolean(body.isActive, currentGuide?.isActive ?? true);
        if (body.isActive !== undefined || !currentGuide) {
            payload.isActive = desiredActive;
        }

        return payload;
    }
}

module.exports = SizeGuideController;

