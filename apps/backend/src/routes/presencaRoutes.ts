import { Router } from 'express';
import { presencaController } from '../controllers/presencaController';
import { verificarToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/agenda', verificarToken, presencaController.minhaAgenda);
router.get('/:eventoId', verificarToken, presencaController.listarPorEvento);
router.post('/:eventoId', verificarToken, presencaController.confirmar);
router.delete('/:eventoId', verificarToken, presencaController.cancelar);

export default router;