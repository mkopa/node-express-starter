import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Boarding API',
      version: '1.0.0',
      description: 'User onboarding system',
    },
    servers: [{ url: '/api/v1' }],
  },
  apis: ['./src/app/routes/*.ts'],
};

export const specs = swaggerJsdoc(options);
export { swaggerUi };
