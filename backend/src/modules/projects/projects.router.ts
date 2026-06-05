import { Router } from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  restoreProject,
} from './projects.controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();

router.use(authenticate as any);

router.get('/', getProjects as any);
router.get('/:id', getProjectById as any);
router.post('/', createProject as any);
router.put('/:id', updateProject as any);
router.delete('/:id', deleteProject as any);
router.post('/:id/restore', restoreProject as any);

export default router;
