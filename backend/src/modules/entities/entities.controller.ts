import { Response, NextFunction } from 'express';
import { prisma } from '../../core/db';
import { AppError } from '../../core/errors';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { generateSafeSlug } from '../../utils/slug';
// Define allowed field type strings (since Prisma enum removed)
const ALLOWED_TYPES = ['TEXT', 'NUMBER', 'BOOLEAN', 'DATE', 'ENUM'];

/**
 * Controller handles dynamic Entities & Fields schemas.
 */
export async function getEntities(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;

    // Verify project belongs to user and is active
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId, deletedAt: null },
    });

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const entities = await prisma.entity.findMany({
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
      fields: e.fields.map(f => ({
        ...f,
        options: f.options ? (f.options as any).split(',') : [],
      })),
      recordsCount: e._count.records,
    }));

    return res.status(200).json({ entities: formattedEntities });
  } catch (err) {
    return next(err);
  }
}

export async function createEntity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { projectId } = req.params;
    const { name, fields } = req.body;
    const userId = req.user!.id;

    if (!name) {
      return next(new AppError('Validation failed: Entity name is required', 400));
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId, deletedAt: null },
    });

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Generate safe API Slug
    const apiSlug = generateSafeSlug(name);

    // Check for slug conflict in this project
    const existingEntity = await prisma.entity.findFirst({
      where: { projectId, apiSlug, deletedAt: null },
    });

    if (existingEntity) {
      return next(new AppError(`Conflict: Entity with slug '${apiSlug}' already exists in this project`, 409));
    }

    // Process fields if provided
    const parsedFields = fields || [];
    const fieldsToCreate: any[] = [];

    // Ensure we don't have duplicate field names/slugs
    const seenFieldSlugs = new Set<string>();

    for (const f of parsedFields) {
      if (!f.name) {
        return next(new AppError('Validation failed: All fields must have a name', 400));
      }
      const fieldSlug = generateSafeSlug(f.name);
      if (seenFieldSlugs.has(fieldSlug)) {
        return next(new AppError(`Validation failed: Duplicate column names detected for '${fieldSlug}'`, 400));
      }
      seenFieldSlugs.add(fieldSlug);

        // Validate field type
        if (!ALLOWED_TYPES.includes(f.type)) {
          return next(new AppError(`Validation failed: Invalid field type '${f.type}'`, 400));
        }

        // If ENUM, accept options as array or comma‑separated string
        if (f.type === 'ENUM') {
          if (!f.options) {
            return next(new AppError(`Validation failed: ENUM field '${f.name}' must have options defined`, 400));
          }
          // Normalize to array for internal handling
          if (typeof f.options === 'string') {
            f.options = f.options.split(',').map(o => o.trim()).filter(o => o);
          }
          if (!Array.isArray(f.options) || f.options.length === 0) {
            return next(new AppError(`Validation failed: ENUM field '${f.name}' must have non‑empty options`, 400));
          }
        }

        fieldsToCreate.push({
          name: f.name,
          apiSlug: fieldSlug,
          type: f.type,
          required: !!f.required,
          defaultValue: f.defaultValue !== undefined ? String(f.defaultValue) : null,
          // Store options as comma‑separated string if ENUM
          options: f.type === 'ENUM' ? (Array.isArray(f.options) ? f.options.map(String).join(',') : String(f.options)) : null,
        });
    }

    // Create Entity and Fields in atomic database transaction
    const newEntity = await prisma.$transaction(async (tx) => {
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

    const formattedEntity = newEntity ? {
      ...newEntity,
      fields: newEntity.fields.map(f => ({
        ...f,
        options: f.options ? (f.options as any).split(',') : [],
      })),
    } : null;

    return res.status(201).json({
      message: 'Entity and schema fields created successfully',
      entity: {
        ...formattedEntity,
        recordsCount: 0,
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function updateEntitySchema(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { projectId, entityId } = req.params;
    const { name, fields } = req.body;
    const userId = req.user!.id;

    // Verify ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId, deletedAt: null },
    });

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const entity = await prisma.entity.findFirst({
      where: { id: entityId, projectId, deletedAt: null },
      include: { fields: true },
    });

    if (!entity) {
      return next(new AppError('Entity not found', 404));
    }

    let updatedApiSlug = entity.apiSlug;
    if (name && name !== entity.name) {
      updatedApiSlug = generateSafeSlug(name);
      // Verify no conflict
      const conflict = await prisma.entity.findFirst({
        where: {
          projectId,
          apiSlug: updatedApiSlug,
          deletedAt: null,
          NOT: { id: entityId },
        },
      });
      if (conflict) {
        return next(new AppError(`Conflict: Another entity already uses slug '${updatedApiSlug}'`, 409));
      }
    }

    const fieldsToSync = fields || [];

    const updatedEntity = await prisma.$transaction(async (tx) => {
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
      const incomingFieldIds = fieldsToSync.map((f: any) => f.id).filter(Boolean);

      // Fields to delete: present in database but not in incoming fields list
      const fieldIdsToDelete = existingFieldIds.filter(id => !incomingFieldIds.includes(id));

      if (fieldIdsToDelete.length > 0) {
        await tx.field.deleteMany({
          where: { id: { in: fieldIdsToDelete } },
        });
      }

      // Fields to update or create
      const seenFieldSlugs = new Set<string>();

      for (const incomingField of fieldsToSync) {
        const fieldSlug = generateSafeSlug(incomingField.name);

        if (seenFieldSlugs.has(fieldSlug)) {
          throw new AppError(`Validation failed: Duplicate column names detected for '${fieldSlug}'`, 400);
        }
        seenFieldSlugs.add(fieldSlug);

          // Validation for type & enum options
          if (!ALLOWED_TYPES.includes(incomingField.type)) {
            throw new AppError(`Validation failed: Invalid field type '${incomingField.type}'`, 400);
          }
          if (incomingField.type === 'ENUM') {
            if (!incomingField.options) {
              throw new AppError(`Validation failed: ENUM field '${incomingField.name}' requires options`, 400);
            }
            if (typeof incomingField.options === 'string') {
              incomingField.options = incomingField.options.split(',').map(o => o.trim()).filter(o => o);
            }
            if (!Array.isArray(incomingField.options) || incomingField.options.length === 0) {
              throw new AppError(`Validation failed: ENUM field '${incomingField.name}' requires non‑empty options`, 400);
            }
          }

        const fieldData = {
          name: incomingField.name,
          apiSlug: fieldSlug,
          type: incomingField.type,
          required: !!incomingField.required,
          defaultValue: incomingField.defaultValue !== undefined ? String(incomingField.defaultValue) : null,
          options: incomingField.type === 'ENUM' ? (Array.isArray(incomingField.options) ? incomingField.options.map(String).join(',') : String(incomingField.options)) : null,
        };

        if (incomingField.id && existingFieldIds.includes(incomingField.id)) {
          // UPDATE
          await tx.field.update({
            where: { id: incomingField.id },
            data: fieldData,
          });
        } else {
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

    const formattedEntity = updatedEntity ? {
      ...updatedEntity,
      fields: updatedEntity.fields.map(f => ({
        ...f,
        options: f.options ? (f.options as any).split(',') : [],
      })),
    } : null;

    return res.status(200).json({
      message: 'Entity schema updated successfully',
      entity: formattedEntity,
    });
  } catch (err) {
    return next(err);
  }
}

export async function deleteEntity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { projectId, entityId } = req.params;
    const userId = req.user!.id;

    // Verify ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId, deletedAt: null },
    });

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const entity = await prisma.entity.findFirst({
      where: { id: entityId, projectId, deletedAt: null },
    });

    if (!entity) {
      return next(new AppError('Entity not found or already deleted', 404));
    }

    // Perform Soft Delete on Entity
    await prisma.entity.update({
      where: { id: entityId },
      data: { deletedAt: new Date() },
    });

    // Also soft-delete all records belonging to this entity for safety
    await prisma.entityRecord.updateMany({
      where: { entityId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    return res.status(200).json({
      message: 'Entity and related data soft-deleted successfully',
      id: entityId,
    });
  } catch (err) {
    return next(err);
  }
}
