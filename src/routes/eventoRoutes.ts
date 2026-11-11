import { Router } from 'express';
import { eventoController } from '../controllers/eventoController';

const router = Router();

router.get('/', eventoController.listar);
router.get('/:id', eventoController.buscarPorId);

export default router;