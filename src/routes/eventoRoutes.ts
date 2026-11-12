import { Router } from 'express';
import { eventoController } from '../controllers/eventoController';

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

export default router;