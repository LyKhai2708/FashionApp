const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const options = {
    failOnErrors: true,
    definition: {
        openapi: '3.1.0',
        info: {
            title: 'Fashion API',
            version: '1.0.0',
            description: 'A simple Fashion API',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
    },
    apis: ['./src/routes/*.js', './src/docs/components.yaml'],
};
const specs = swaggerJsdoc(options);

module.exports = {
    specs,
    swaggerUi,
};