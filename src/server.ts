import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import eventoRoutes from './routes/eventoRoutes';
import usuarioRoutes from './routes/usuarioRoutes'; // Import novo

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/api/eventos', eventoRoutes);
app.use('/api/usuarios', usuarioRoutes); // Rota nova

app.get('/api/status', (req, res) => {
  res.json({ status: 'API KdABoa rodando!', release: 2 });
});

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});