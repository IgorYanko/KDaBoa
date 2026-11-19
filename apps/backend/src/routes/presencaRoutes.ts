import { Router } from 'express';
import { presencaController } from '../controllers/presencaController';
import { verificarToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/:eventoId', presencaController.listarPorEvento);
router.post('/:eventoId', verificarToken, presencaController.confirmar);
router.delete('/:eventoId', verificarToken, presencaController.cancelar);

export default router;