import { Router } from 'express';
import { conversaController } from '../controllers/conversaController';
import { verificarToken } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/conversas:
 *   get:
 *     summary: Pessoas que seguem de volta e conversas existentes (chat mútuo)
 *     tags: [Conversas]
 *     security: [{ bearerAuth: [] }]
 * /api/conversas/{usuarioId}:
 *   get:
 *     summary: Histórico da conversa com um usuário
 *     tags: [Conversas]
 *     security: [{ bearerAuth: [] }]
 *   post:
 *     summary: Envia mensagem (só quem se segue nos dois sentidos e sem bloqueio)
 *     tags: [Conversas]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/', verificarToken, conversaController.listar);
router.get('/:usuarioId', verificarToken, conversaController.abrir);
router.post('/:usuarioId', verificarToken, conversaController.enviar);

export default router;
