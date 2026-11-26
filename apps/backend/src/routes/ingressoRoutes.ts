import { Router } from 'express';
import { pagamentoController } from '../controllers/pagamentoController';
import { verificarToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', verificarToken, pagamentoController.meusIngressos);

export default router;
