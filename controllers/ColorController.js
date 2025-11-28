const fs = require('fs');
const path = require('path');
const Color = require('../models/Color');

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

function ensureLeadingSlash(filePath = '') {
    if (!filePath) return '';
    return filePath.startsWith('/') ? filePath : `/${filePath}`;
}

function resolvePublicPath(storedPath = '') {
    if (!storedPath) return '';
    const relativePath = storedPath.replace(/^\//, '');
    return path.join(__dirname, '..', 'public', relativePath);
}

function removeFile(storedPath) {
    if (!storedPath) return;
    const absolute = resolvePublicPath(storedPath);
    if (!absolute) return;
    fs.access(absolute, fs.constants.F_OK, (accessErr) => {
        if (accessErr) return;
        fs.unlink(absolute, (unlinkErr) => {
            if (unlinkErr && unlinkErr.code !== 'ENOENT') {
                console.error('Dosya silinirken hata oluştu:', unlinkErr);
            }
        });
    });
}

function deriveLabel(originalName, filePath, currentLabel) {
    if (originalName) {
        return path.parse(originalName).name.trim() || currentLabel || 'Renk';
    }
    if (filePath) {
        const base = path.parse(filePath).name.trim();
        if (base) return base;
    }
    return currentLabel || 'Renk';
}

function preparePayload({ body = {}, currentColor, newImagePath, newImageOriginalName }) {
    const payload = {};

    if (newImagePath) {
        payload.imageUrl = ensureLeadingSlash(newImagePath);
        payload.label = deriveLabel(newImageOriginalName, newImagePath, currentColor?.label);
    } else if (!currentColor) {
        throw new Error('Renk resmi zorunludur');
    } else {
        payload.label = currentColor.label || deriveLabel(null, currentColor.imageUrl, currentColor.label);
    }

    if (body.isActive !== undefined || !currentColor) {
        payload.isActive = normalizeBoolean(body.isActive, currentColor?.isActive ?? true);
    }

    return payload;
}

function serializeColor(color) {
    const plain = color.toJSON();
    plain.imageUrl = ensureLeadingSlash(plain.imageUrl || '');
    plain.label = plain.label || deriveLabel(null, plain.imageUrl, plain.label);
    plain.isActive = !!plain.isActive;
    return plain;
}

class ColorController {
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

                const { rows, count } = await Color.findAndCountAll({
                    where: baseWhere,
                    order: [['updatedAt', 'DESC']],
                    limit: pageSize,
                    offset
                });

                const totalPages = Math.max(1, Math.ceil(count / pageSize));

                res.json({
                    items: rows.map(serializeColor),
                    totalItems: count,
                    totalPages,
                    currentPage: Math.min(page, totalPages),
                    pageSize
                });
                return;
            }

            const colors = await Color.findAll({
                where: baseWhere,
                order: [['updatedAt', 'DESC']]
            });
            res.json(colors.map(serializeColor));
        } catch (error) {
            res.status(500).json({ error: 'Renkler getirilirken bir hata oluştu' });
        }
    }

    static async getById(req, res) {
        try {
            const color = await Color.findByPk(req.params.id);
            if (!color) {
                return res.status(404).json({ error: 'Renk kaydı bulunamadı' });
            }
            res.json(serializeColor(color));
        } catch (error) {
            res.status(500).json({ error: 'Renk kaydı getirilirken bir hata oluştu' });
        }
    }

    static async create(req, res) {
        try {
            const filePath = req.file ? path.posix.join('uploads/colors', req.file.filename) : '';
            const payload = preparePayload({
                body: req.body,
                newImagePath: filePath,
                newImageOriginalName: req.file?.originalname
            });
            const color = await Color.create(payload);
            res.status(201).json(serializeColor(color));
        } catch (error) {
            if (req.file) {
                removeFile(path.posix.join('uploads/colors', req.file.filename));
            }
            res.status(400).json({
                error: 'Renk kaydı oluşturulurken bir hata oluştu',
                details: error.message
            });
        }
    }

    static async update(req, res) {
        try {
            const color = await Color.findByPk(req.params.id);
            if (!color) {
                if (req.file) {
                    removeFile(path.posix.join('uploads/colors', req.file.filename));
                }
                return res.status(404).json({ error: 'Renk kaydı bulunamadı' });
            }

            const newFilePath = req.file ? path.posix.join('uploads/colors', req.file.filename) : '';
            const previousImage = color.imageUrl;
            const payload = preparePayload({
                body: req.body,
                currentColor: color,
                newImagePath: newFilePath,
                newImageOriginalName: req.file?.originalname
            });

            if (!Object.keys(payload).length) {
                if (req.file) {
                    removeFile(path.posix.join('uploads/colors', req.file.filename));
                }
                return res.json(serializeColor(color));
            }

            await color.update(payload);
            await color.reload();

            if (newFilePath && previousImage && ensureLeadingSlash(previousImage) !== ensureLeadingSlash(newFilePath)) {
                removeFile(previousImage);
            }

            res.json(serializeColor(color));
        } catch (error) {
            if (req.file) {
                removeFile(path.posix.join('uploads/colors', req.file.filename));
            }
            res.status(400).json({
                error: 'Renk kaydı güncellenirken bir hata oluştu',
                details: error.message
            });
        }
    }

    static async remove(req, res) {
        try {
            const color = await Color.findByPk(req.params.id);
            if (!color) {
                return res.status(404).json({ error: 'Renk kaydı bulunamadı' });
            }
            const storedImage = color.imageUrl;
            await color.destroy();
            removeFile(storedImage);
            res.json({ message: 'Renk kaydı silindi' });
        } catch (error) {
            res.status(500).json({ error: 'Renk kaydı silinirken bir hata oluştu' });
        }
    }
}

module.exports = ColorController;


