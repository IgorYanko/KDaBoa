import { Router } from 'express';
import { getLocais } from '../controllers/localController';

const router = Router();
router.get('/', getLocais);

export default router;