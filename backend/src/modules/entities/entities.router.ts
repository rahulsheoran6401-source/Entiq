import { Router } from 'express';
import {
  getEntities,
  createEntity,
  updateEntitySchema,
  deleteEntity,
} from './entities.controller';
import { authenticate } from '../../middlewares/auth';

const router = Router({ mergeParams: true });

router.use(authenticate as any);

router.get('/', getEntities as any);
router.post('/', createEntity as any);
router.put('/:entityId', updateEntitySchema as any);
router.delete('/:entityId', deleteEntity as any);

export default router;
