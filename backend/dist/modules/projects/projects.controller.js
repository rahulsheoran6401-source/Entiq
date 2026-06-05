"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjects = getProjects;
exports.getProjectById = getProjectById;
exports.createProject = createProject;
exports.updateProject = updateProject;
exports.deleteProject = deleteProject;
exports.restoreProject = restoreProject;
const db_1 = require("../../core/db");
const errors_1 = require("../../core/errors");
/**
 * Controller handles project workspaces, supporting soft deletes and restores.
 */
async function getProjects(req, res, next) {
    try {
        const userId = req.user.id;
        // Fetch active projects that are NOT soft deleted
        const projects = await db_1.prisma.project.findMany({
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
    }
    catch (err) {
        return next(err);
    }
}
async function getProjectById(req, res, next) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const project = await db_1.prisma.project.findFirst({
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
            return next(new errors_1.AppError('Project not found or has been deleted', 404));
        }
        return res.status(200).json({ project });
    }
    catch (err) {
        return next(err);
    }
}
async function createProject(req, res, next) {
    try {
        const userId = req.user.id;
        const { name, description } = req.body;
        if (!name) {
            return next(new errors_1.AppError('Validation failed: Project name is required', 400));
        }
        const project = await db_1.prisma.project.create({
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
    }
    catch (err) {
        return next(err);
    }
}
async function updateProject(req, res, next) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { name, description } = req.body;
        const project = await db_1.prisma.project.findFirst({
            where: { id, userId, deletedAt: null },
        });
        if (!project) {
            return next(new errors_1.AppError('Project not found or has been deleted', 404));
        }
        const updatedProject = await db_1.prisma.project.update({
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
    }
    catch (err) {
        return next(err);
    }
}
async function deleteProject(req, res, next) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const project = await db_1.prisma.project.findFirst({
            where: { id, userId, deletedAt: null },
        });
        if (!project) {
            return next(new errors_1.AppError('Project not found or already deleted', 404));
        }
        // Perform Soft Delete
        await db_1.prisma.project.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        return res.status(200).json({
            message: 'Project soft-deleted successfully',
            id,
        });
    }
    catch (err) {
        return next(err);
    }
}
async function restoreProject(req, res, next) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const project = await db_1.prisma.project.findFirst({
            where: { id, userId, NOT: { deletedAt: null } },
        });
        if (!project) {
            return next(new errors_1.AppError('Project not found or is already active', 404));
        }
        // Restore project by setting deletedAt to null
        const restoredProject = await db_1.prisma.project.update({
            where: { id },
            data: { deletedAt: null },
        });
        return res.status(200).json({
            message: 'Project restored successfully',
            project: restoredProject,
        });
    }
    catch (err) {
        return next(err);
    }
}
