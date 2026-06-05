"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEntities = getEntities;
exports.createEntity = createEntity;
exports.updateEntitySchema = updateEntitySchema;
exports.deleteEntity = deleteEntity;
const db_1 = require("../../core/db");
const errors_1 = require("../../core/errors");
const slug_1 = require("../../utils/slug");
const client_1 = require("@prisma/client");
/**
 * Controller handles dynamic Entities & Fields schemas.
 */
async function getEntities(req, res, next) {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;
        // Verify project belongs to user and is active
        const project = await db_1.prisma.project.findFirst({
            where: { id: projectId, userId, deletedAt: null },
        });
        if (!project) {
            return next(new errors_1.AppError('Project not found', 404));
        }
        const entities = await db_1.prisma.entity.findMany({
            where: { projectId, deletedAt: null },
            include: {
                fields: true,
                _count: {
                    select: { records: { where: { deletedAt: null } } },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        const formattedEntities = entities.map(e => ({
            id: e.id,
            name: e.name,
            apiSlug: e.apiSlug,
            createdAt: e.createdAt,
            updatedAt: e.updatedAt,
            fields: e.fields,
            recordsCount: e._count.records,
        }));
        return res.status(200).json({ entities: formattedEntities });
    }
    catch (err) {
        return next(err);
    }
}
async function createEntity(req, res, next) {
    try {
        const { projectId } = req.params;
        const { name, fields } = req.body;
        const userId = req.user.id;
        if (!name) {
            return next(new errors_1.AppError('Validation failed: Entity name is required', 400));
        }
        // Verify project ownership
        const project = await db_1.prisma.project.findFirst({
            where: { id: projectId, userId, deletedAt: null },
        });
        if (!project) {
            return next(new errors_1.AppError('Project not found', 404));
        }
        // Generate safe API Slug
        const apiSlug = (0, slug_1.generateSafeSlug)(name);
        // Check for slug conflict in this project
        const existingEntity = await db_1.prisma.entity.findFirst({
            where: { projectId, apiSlug, deletedAt: null },
        });
        if (existingEntity) {
            return next(new errors_1.AppError(`Conflict: Entity with slug '${apiSlug}' already exists in this project`, 409));
        }
        // Process fields if provided
        const parsedFields = fields || [];
        const fieldsToCreate = [];
        // Ensure we don't have duplicate field names/slugs
        const seenFieldSlugs = new Set();
        for (const f of parsedFields) {
            if (!f.name) {
                return next(new errors_1.AppError('Validation failed: All fields must have a name', 400));
            }
            const fieldSlug = (0, slug_1.generateSafeSlug)(f.name);
            if (seenFieldSlugs.has(fieldSlug)) {
                return next(new errors_1.AppError(`Validation failed: Duplicate column names detected for '${fieldSlug}'`, 400));
            }
            seenFieldSlugs.add(fieldSlug);
            // Validate field type
            if (!Object.values(client_1.FieldType).includes(f.type)) {
                return next(new errors_1.AppError(`Validation failed: Invalid field type '${f.type}'`, 400));
            }
            // If ENUM, validate options
            if (f.type === client_1.FieldType.ENUM && (!f.options || !Array.isArray(f.options) || f.options.length === 0)) {
                return next(new errors_1.AppError(`Validation failed: ENUM field '${f.name}' must have options defined`, 400));
            }
            fieldsToCreate.push({
                name: f.name,
                apiSlug: fieldSlug,
                type: f.type,
                required: !!f.required,
                defaultValue: f.defaultValue !== undefined ? String(f.defaultValue) : null,
                options: f.type === client_1.FieldType.ENUM ? f.options.map(String) : [],
            });
        }
        // Create Entity and Fields in atomic database transaction
        const newEntity = await db_1.prisma.$transaction(async (tx) => {
            const entity = await tx.entity.create({
                data: {
                    name,
                    apiSlug,
                    projectId,
                },
            });
            if (fieldsToCreate.length > 0) {
                await tx.field.createMany({
                    data: fieldsToCreate.map(f => ({
                        ...f,
                        entityId: entity.id,
                    })),
                });
            }
            return tx.entity.findUnique({
                where: { id: entity.id },
                include: { fields: true },
            });
        });
        return res.status(201).json({
            message: 'Entity and schema fields created successfully',
            entity: {
                ...newEntity,
                recordsCount: 0,
            },
        });
    }
    catch (err) {
        return next(err);
    }
}
async function updateEntitySchema(req, res, next) {
    try {
        const { projectId, entityId } = req.params;
        const { name, fields } = req.body;
        const userId = req.user.id;
        // Verify ownership
        const project = await db_1.prisma.project.findFirst({
            where: { id: projectId, userId, deletedAt: null },
        });
        if (!project) {
            return next(new errors_1.AppError('Project not found', 404));
        }
        const entity = await db_1.prisma.entity.findFirst({
            where: { id: entityId, projectId, deletedAt: null },
            include: { fields: true },
        });
        if (!entity) {
            return next(new errors_1.AppError('Entity not found', 404));
        }
        let updatedApiSlug = entity.apiSlug;
        if (name && name !== entity.name) {
            updatedApiSlug = (0, slug_1.generateSafeSlug)(name);
            // Verify no conflict
            const conflict = await db_1.prisma.entity.findFirst({
                where: {
                    projectId,
                    apiSlug: updatedApiSlug,
                    deletedAt: null,
                    NOT: { id: entityId },
                },
            });
            if (conflict) {
                return next(new errors_1.AppError(`Conflict: Another entity already uses slug '${updatedApiSlug}'`, 409));
            }
        }
        const fieldsToSync = fields || [];
        const updatedEntity = await db_1.prisma.$transaction(async (tx) => {
            // 1. Update entity core details
            await tx.entity.update({
                where: { id: entityId },
                data: {
                    name: name || entity.name,
                    apiSlug: updatedApiSlug,
                },
            });
            // 2. Perform advanced Column Schema synchronization (sync existing, create new, prune removed)
            const existingFieldIds = entity.fields.map(f => f.id);
            const incomingFieldIds = fieldsToSync.map((f) => f.id).filter(Boolean);
            // Fields to delete: present in database but not in incoming fields list
            const fieldIdsToDelete = existingFieldIds.filter(id => !incomingFieldIds.includes(id));
            if (fieldIdsToDelete.length > 0) {
                await tx.field.deleteMany({
                    where: { id: { in: fieldIdsToDelete } },
                });
            }
            // Fields to update or create
            const seenFieldSlugs = new Set();
            for (const incomingField of fieldsToSync) {
                const fieldSlug = (0, slug_1.generateSafeSlug)(incomingField.name);
                if (seenFieldSlugs.has(fieldSlug)) {
                    throw new errors_1.AppError(`Validation failed: Duplicate column names detected for '${fieldSlug}'`, 400);
                }
                seenFieldSlugs.add(fieldSlug);
                // Validation for type & enum options
                if (!Object.values(client_1.FieldType).includes(incomingField.type)) {
                    throw new errors_1.AppError(`Validation failed: Invalid field type '${incomingField.type}'`, 400);
                }
                if (incomingField.type === client_1.FieldType.ENUM && (!incomingField.options || incomingField.options.length === 0)) {
                    throw new errors_1.AppError(`Validation failed: ENUM field '${incomingField.name}' requires options`, 400);
                }
                const fieldData = {
                    name: incomingField.name,
                    apiSlug: fieldSlug,
                    type: incomingField.type,
                    required: !!incomingField.required,
                    defaultValue: incomingField.defaultValue !== undefined ? String(incomingField.defaultValue) : null,
                    options: incomingField.type === client_1.FieldType.ENUM ? incomingField.options.map(String) : [],
                };
                if (incomingField.id && existingFieldIds.includes(incomingField.id)) {
                    // UPDATE
                    await tx.field.update({
                        where: { id: incomingField.id },
                        data: fieldData,
                    });
                }
                else {
                    // CREATE NEW
                    await tx.field.create({
                        data: {
                            ...fieldData,
                            entityId,
                        },
                    });
                }
            }
            return tx.entity.findUnique({
                where: { id: entityId },
                include: { fields: true },
            });
        });
        return res.status(200).json({
            message: 'Entity schema updated successfully',
            entity: updatedEntity,
        });
    }
    catch (err) {
        return next(err);
    }
}
async function deleteEntity(req, res, next) {
    try {
        const { projectId, entityId } = req.params;
        const userId = req.user.id;
        // Verify ownership
        const project = await db_1.prisma.project.findFirst({
            where: { id: projectId, userId, deletedAt: null },
        });
        if (!project) {
            return next(new errors_1.AppError('Project not found', 404));
        }
        const entity = await db_1.prisma.entity.findFirst({
            where: { id: entityId, projectId, deletedAt: null },
        });
        if (!entity) {
            return next(new errors_1.AppError('Entity not found or already deleted', 404));
        }
        // Perform Soft Delete on Entity
        await db_1.prisma.entity.update({
            where: { id: entityId },
            data: { deletedAt: new Date() },
        });
        // Also soft-delete all records belonging to this entity for safety
        await db_1.prisma.entityRecord.updateMany({
            where: { entityId, deletedAt: null },
            data: { deletedAt: new Date() },
        });
        return res.status(200).json({
            message: 'Entity and related data soft-deleted successfully',
            id: entityId,
        });
    }
    catch (err) {
        return next(err);
    }
}
