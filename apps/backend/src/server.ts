import dotenv from 'dotenv';
import app from './app';

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('Defina JWT_SECRET em apps/backend/.env');
}

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
