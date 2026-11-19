import { Router } from 'express';
import { usuarioController } from '../controllers/usuarioController';

const router = Router();

router.post('/cadastro', usuarioController.cadastrar);
router.post('/login', usuarioController.login);
router.post('/esqueci-senha', usuarioController.esqueciSenha);
router.post('/recuperar-senha', usuarioController.esqueciSenha);
router.post('/redefinir-senha', usuarioController.redefinirSenha);

export default router;