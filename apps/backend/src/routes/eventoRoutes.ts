import { Router } from 'express';
import { eventoController } from '../controllers/eventoController';
import { verificarToken } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/eventos:
 *   get:
 *     summary: Retorna a lista de todos os eventos
 *     tags: [Eventos]
 *     responses:
 *       200:
 *         description: Lista de eventos retornada com sucesso.
 */
router.get('/', eventoController.listar);
router.get('/:id', eventoController.buscarPorId);
router.post('/', verificarToken, eventoController.criar);

export default router;