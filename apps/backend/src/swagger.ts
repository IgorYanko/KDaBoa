import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'KdABoa API',
      version: '1.0.0',
      description: 'Documentação dos endpoints do KdABoa',
    },
    servers: [
      {
        url: 'http://localhost:3333',
        description: 'Servidor Local',
      },
    ],
  },
  // Diz para o Swagger procurar a documentação dentro dos seus arquivos de rotas
  apis: ['./src/routes/*.ts'], 
};

export const swaggerSpec = swaggerJsdoc(options);