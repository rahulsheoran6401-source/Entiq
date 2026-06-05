"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecords = getRecords;
exports.getRecordById = getRecordById;
exports.createRecord = createRecord;
exports.updateRecord = updateRecord;
exports.deleteRecord = deleteRecord;
exports.restoreRecord = restoreRecord;
const db_1 = require("../../core/db");
const errors_1 = require("../../core/errors");
const validation_1 = require("../../core/validation");
/**
 * Helper to fetch and resolve entity metadata by slug.
 */
async function resolveEntityOrThrow(projectId, entitySlug, userId) {
    // 1. Verify project ownership
    const project = await db_1.prisma.project.findFirst({
        where: { id: projectId, userId, deletedAt: null },
    });
    if (!project) {
        throw new errors_1.AppError('Project not found or access denied', 404);
    }
    // 2. Fetch the entity
    const entity = await db_1.prisma.entity.findFirst({
        where: { projectId, apiSlug: entitySlug, deletedAt: null },
        include: { fields: true },
    });
    if (!entity) {
        throw new errors_1.AppError(`Entity resource '${entitySlug}' not found in this project`, 404);
    }
    return entity;
}
/**
 * Controller handles runtime generated CRUD operations for any user-defined schema entity.
 */
async function getRecords(req, res, next) {
    try {
        const { projectId, entitySlug } = req.params;
        const userId = req.user.id;
        // Resolve Entity schema
        const entity = await resolveEntityOrThrow(projectId, entitySlug, userId);
        // Fetch database records
        const dbRecords = await db_1.prisma.entityRecord.findMany({
            where: {
                entityId: entity.id,
                deletedAt: null,
            },
            orderBy: { createdAt: 'desc' },
        });
        // Merge system properties (id, createdAt, updatedAt) with dynamic properties
        let records = dbRecords.map(r => ({
            id: r.id,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
            ...r.data,
        }));
        // 1. Apply Dynamic Metadata Filtering
        for (const field of entity.fields) {
            const queryVal = req.query[field.apiSlug];
            if (queryVal !== undefined && queryVal !== '') {
                records = records.filter(r => {
                    const recordVal = r[field.apiSlug];
                    if (recordVal === undefined || recordVal === null)
                        return false;
                    return String(recordVal).toLowerCase().includes(String(queryVal).toLowerCase());
                });
            }
        }
        // 2. Apply Custom Sorting
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
        records.sort((a, b) => {
            const valA = a[sortBy];
            const valB = b[sortBy];
            if (valA === undefined || valA === null)
                return 1;
            if (valB === undefined || valB === null)
                return -1;
            if (valA < valB)
                return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB)
                return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        // 3. Apply Pagination
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
        const totalCount = records.length;
        const paginatedRecords = records.slice((page - 1) * limit, page * limit);
        return res.status(200).json({
            entity: {
                id: entity.id,
                name: entity.name,
                apiSlug: entity.apiSlug,
                fields: entity.fields,
            },
            pagination: {
                page,
                limit,
                total: totalCount,
                pages: Math.ceil(totalCount / limit),
            },
            records: paginatedRecords,
        });
    }
    catch (err) {
        return next(err);
    }
}
async function getRecordById(req, res, next) {
    try {
        const { projectId, entitySlug, recordId } = req.params;
        const userId = req.user.id;
        const entity = await resolveEntityOrThrow(projectId, entitySlug, userId);
        const record = await db_1.prisma.entityRecord.findFirst({
            where: {
                id: recordId,
                entityId: entity.id,
                deletedAt: null,
            },
        });
        if (!record) {
            return next(new errors_1.AppError('Record resource not found', 404));
        }
        return res.status(200).json({
            record: {
                id: record.id,
                createdAt: record.createdAt,
                updatedAt: record.updatedAt,
                ...record.data,
            },
        });
    }
    catch (err) {
        return next(err);
    }
}
async function createRecord(req, res, next) {
    try {
        const { projectId, entitySlug } = req.params;
        const userId = req.user.id;
        const entity = await resolveEntityOrThrow(projectId, entitySlug, userId);
        // Validate payload against schema definitions
        const validation = (0, validation_1.validateRecordPayload)(req.body, entity.fields, false);
        if (!validation.valid) {
            return next(new errors_1.AppError('Validation failed: Schema mismatch', 400, validation.errors));
        }
        // Save record
        const record = await db_1.prisma.entityRecord.create({
            data: {
                entityId: entity.id,
                data: validation.data,
            },
        });
        return res.status(201).json({
            message: 'Record created successfully',
            record: {
                id: record.id,
                createdAt: record.createdAt,
                updatedAt: record.updatedAt,
                ...validation.data,
            },
        });
    }
    catch (err) {
        return next(err);
    }
}
async function updateRecord(req, res, next) {
    try {
        const { projectId, entitySlug, recordId } = req.params;
        const userId = req.user.id;
        const entity = await resolveEntityOrThrow(projectId, entitySlug, userId);
        const record = await db_1.prisma.entityRecord.findFirst({
            where: {
                id: recordId,
                entityId: entity.id,
                deletedAt: null,
            },
        });
        if (!record) {
            return next(new errors_1.AppError('Record not found or already deleted', 404));
        }
        // Validate updated columns
        const validation = (0, validation_1.validateRecordPayload)(req.body, entity.fields, true);
        if (!validation.valid) {
            return next(new errors_1.AppError('Validation failed: Schema mismatch on edit', 400, validation.errors));
        }
        // Merge existing JSON properties with incoming changes
        const mergedData = {
            ...record.data,
            ...validation.data,
        };
        // Update in database
        const updatedRecord = await db_1.prisma.entityRecord.update({
            where: { id: recordId },
            data: { data: mergedData },
        });
        return res.status(200).json({
            message: 'Record updated successfully',
            record: {
                id: updatedRecord.id,
                createdAt: updatedRecord.createdAt,
                updatedAt: updatedRecord.updatedAt,
                ...mergedData,
            },
        });
    }
    catch (err) {
        return next(err);
    }
}
async function deleteRecord(req, res, next) {
    try {
        const { projectId, entitySlug, recordId } = req.params;
        const userId = req.user.id;
        const entity = await resolveEntityOrThrow(projectId, entitySlug, userId);
        const record = await db_1.prisma.entityRecord.findFirst({
            where: {
                id: recordId,
                entityId: entity.id,
                deletedAt: null,
            },
        });
        if (!record) {
            return next(new errors_1.AppError('Record not found or already deleted', 404));
        }
        // Perform Soft Delete
        await db_1.prisma.entityRecord.update({
            where: { id: recordId },
            data: { deletedAt: new Date() },
        });
        return res.status(200).json({
            message: 'Record soft-deleted successfully',
            id: recordId,
        });
    }
    catch (err) {
        return next(err);
    }
}
async function restoreRecord(req, res, next) {
    try {
        const { projectId, entitySlug, recordId } = req.params;
        const userId = req.user.id;
        const entity = await resolveEntityOrThrow(projectId, entitySlug, userId);
        const record = await db_1.prisma.entityRecord.findFirst({
            where: {
                id: recordId,
                entityId: entity.id,
                NOT: { deletedAt: null },
            },
        });
        if (!record) {
            return next(new errors_1.AppError('Record not found or is already active', 404));
        }
        // Restore Record
        const restoredRecord = await db_1.prisma.entityRecord.update({
            where: { id: recordId },
            data: { deletedAt: null },
        });
        return res.status(200).json({
            message: 'Record restored successfully',
            record: {
                id: restoredRecord.id,
                createdAt: restoredRecord.createdAt,
                updatedAt: restoredRecord.updatedAt,
                ...restoredRecord.data,
            },
        });
    }
    catch (err) {
        return next(err);
    }
}
