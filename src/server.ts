import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import eventoRoutes from './routes/eventoRoutes';
import usuarioRoutes from './routes/usuarioRoutes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Rota da documentação visual (Swagger)
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas da API
app.use('/api/eventos', eventoRoutes);
app.use('/api/usuarios', usuarioRoutes);

app.get('/api/status', (req, res) => {
  res.json({ status: 'API KdABoa rodando!', release: 2 });
});

const PORT = process.env.PORT || 3333;

// É esta função abaixo que mantém o terminal rodando
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});