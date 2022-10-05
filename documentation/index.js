const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '0.0.1',
    },
  },
  apis: ['./api/routes/**/docs.js','./api/routes/main_docs.js'], // files containing annotations as above
};

module.exports = swaggerJsdoc(options);