import { Router } from 'express';
import { pagamentoController } from '../controllers/pagamentoController';

const router = Router();

router.get('/disponivel', pagamentoController.disponivel);
router.post('/webhook', pagamentoController.webhook);

export default router;
