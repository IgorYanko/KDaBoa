import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/authRoutes';
import categoriaRoutes from './routes/categoriaRoutes';
import eventoRoutes from './routes/eventoRoutes';
import localRoutes from './routes/localRoutes';
import usuarioRoutes from './routes/usuarioRoutes';
import { swaggerSpec } from './swagger';

const app = express();

app.use(cors());
app.use(express.json());

// Rota da documentação visual (Swagger)
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas da API
app.use('/api/eventos', eventoRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/locais', localRoutes);
app.use('/api/auth', authRoutes);

app.get('/api/status', (req, res) => {
  res.json({ status: 'API KdABoa rodando!', release: 2 });
});

export default app;
