import { Router } from 'express';
import {
  cadastrar,
  login,
  redefinirSenha,
  solicitarRecuperacaoSenha,
} from '../controllers/authController';

const router = Router();

router.post('/cadastro', cadastrar);
router.post('/login', login);
router.post('/esqueci-senha', solicitarRecuperacaoSenha);
router.post('/recuperar-senha', solicitarRecuperacaoSenha);
router.post('/redefinir-senha', redefinirSenha);

export default router;