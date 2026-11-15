
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.3',

    info: {
      title: 'Booking System API',
      version: '1.0.0',
      description: 'Документація REST API системи бронювання ресурсів'
    },

    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Локальний сервер розробки'
      }
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Введіть Access Token для авторизації'
        }
      }
    }
  },

  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
