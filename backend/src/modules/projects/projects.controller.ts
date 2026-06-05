import { Response, NextFunction } from 'express';
import { prisma } from '../../core/db';
import { AppError } from '../../core/errors';
import { AuthenticatedRequest } from '../../middlewares/auth';

/**
 * Controller handles project workspaces, supporting soft deletes and restores.
 */
export async function getProjects(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;

    // Fetch active projects that are NOT soft deleted
    const projects = await prisma.project.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: { entities: { where: { deletedAt: null } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format count output for easier consumption
    const formattedProjects = projects.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      entitiesCount: p._count.entities,
    }));

    return res.status(200).json({ projects: formattedProjects });
  } catch (err) {
    return next(err);
  }
}

export async function getProjectById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      include: {
        entities: {
          where: { deletedAt: null },
          include: { fields: true },
        },
      },
    });

    if (!project) {
      return next(new AppError('Project not found or has been deleted', 404));
    }

    return res.status(200).json({ project });
  } catch (err) {
    return next(err);
  }
}

export async function createProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { name, description } = req.body;

    if (!name) {
      return next(new AppError('Validation failed: Project name is required', 400));
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        userId,
      },
    });

    return res.status(201).json({
      message: 'Project created successfully',
      project: {
        ...project,
        entitiesCount: 0,
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function updateProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, description } = req.body;

    const project = await prisma.project.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!project) {
      return next(new AppError('Project not found or has been deleted', 404));
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name: name !== undefined ? name : project.name,
        description: description !== undefined ? description : project.description,
      },
    });

    return res.status(200).json({
      message: 'Project updated successfully',
      project: updatedProject,
    });
  } catch (err) {
    return next(err);
  }
}

export async function deleteProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!project) {
      return next(new AppError('Project not found or already deleted', 404));
    }

    // Perform Soft Delete
    await prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return res.status(200).json({
      message: 'Project soft-deleted successfully',
      id,
    });
  } catch (err) {
    return next(err);
  }
}

export async function restoreProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: { id, userId, NOT: { deletedAt: null } },
    });

    if (!project) {
      return next(new AppError('Project not found or is already active', 404));
    }

    // Restore project by setting deletedAt to null
    const restoredProject = await prisma.project.update({
      where: { id },
      data: { deletedAt: null },
    });

    return res.status(200).json({
      message: 'Project restored successfully',
      project: restoredProject,
    });
  } catch (err) {
    return next(err);
  }
}
