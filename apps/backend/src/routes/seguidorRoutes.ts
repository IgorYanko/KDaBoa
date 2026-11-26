import { Router } from 'express';
import { seguidorController } from '../controllers/seguidorController';
import { verificarToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/:usuarioId', verificarToken, seguidorController.seguir);
router.delete('/:usuarioId', verificarToken, seguidorController.deixarDeSeguir);

export default router;