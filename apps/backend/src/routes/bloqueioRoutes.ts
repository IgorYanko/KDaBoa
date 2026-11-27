import { Router } from 'express';
import { bloqueioController } from '../controllers/bloqueioController';
import { verificarToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', verificarToken, bloqueioController.listar);
router.post('/', verificarToken, bloqueioController.bloquear);
router.post('/:usuarioId', verificarToken, bloqueioController.bloquear);
router.delete('/:usuarioId', verificarToken, bloqueioController.desbloquear);

export default router;