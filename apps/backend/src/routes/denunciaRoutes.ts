import { Router } from 'express';
import { denunciaController } from '../controllers/denunciaController';
import { verificarToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', verificarToken, denunciaController.denunciar);
router.post('/:eventoId/:mensagemId', verificarToken, denunciaController.denunciar);

export default router;