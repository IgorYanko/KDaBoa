import http from 'node:http';
import dotenv from 'dotenv';
import app from './app';
import { configurarSocket } from './socket';

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('Defina JWT_SECRET em apps/backend/.env');
}

const PORT = process.env.PORT || 3333;

const server = http.createServer(app);
configurarSocket(server);

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});