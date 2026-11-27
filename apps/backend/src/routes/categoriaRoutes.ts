import { Router } from 'express';
import {
  atualizarCategoria,
  criarCategoria,
  excluirCategoria,
  getCategorias,
} from '../controllers/categoriaController';
import { exigirPerfil, verificarToken } from '../middlewares/authMiddleware';

const router = Router();
router.get('/', getCategorias);

// Área de admin: só o perfil ADMIN cria, edita e exclui categorias.
router.post('/', verificarToken, exigirPerfil('ADMIN'), criarCategoria);
router.put('/:id', verificarToken, exigirPerfil('ADMIN'), atualizarCategoria);
router.delete('/:id', verificarToken, exigirPerfil('ADMIN'), excluirCategoria);

export default router;
