import { Router } from 'express';
import { pagamentoController } from '../controllers/pagamentoController';
import { verificarToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/:id', verificarToken, pagamentoController.buscar);

export default router;
