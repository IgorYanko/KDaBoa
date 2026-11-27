import { Router } from 'express';
import { atualizarLocal, criarLocal, excluirLocal, getLocais } from '../controllers/localController';
import { exigirPerfil, verificarToken } from '../middlewares/authMiddleware';

const router = Router();
router.get('/', getLocais);

// Área de admin: só o perfil ADMIN cria, edita e exclui locais.
router.post('/', verificarToken, exigirPerfil('ADMIN'), criarLocal);
router.put('/:id', verificarToken, exigirPerfil('ADMIN'), atualizarLocal);
router.delete('/:id', verificarToken, exigirPerfil('ADMIN'), excluirLocal);

export default router;
