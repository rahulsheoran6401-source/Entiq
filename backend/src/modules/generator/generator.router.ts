import { Router } from 'express';
import {
  getRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
  restoreRecord,
} from './generator.controller';
import { authenticate } from '../../middlewares/auth';

const router = Router({ mergeParams: true });

router.use(authenticate as any);

router.get('/', getRecords as any);
router.post('/', createRecord as any);
router.get('/:recordId', getRecordById as any);
router.put('/:recordId', updateRecord as any);
router.delete('/:recordId', deleteRecord as any);
router.post('/:recordId/restore', restoreRecord as any);

export default router;
