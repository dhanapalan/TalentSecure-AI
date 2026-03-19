import swaggerAutogen from 'swagger-autogen';

const doc = {
    info: {
        title: 'TalentSecure AI API',
        description: 'API Documentation for the TalentSecure examination and recruitment platform',
        version: '1.0.0',
    },
    host: 'localhost:5050',
    basePath: '/',
    schemes: ['http'],
    securityDefinitions: {
        BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
        },
    },
    security: [
        { BearerAuth: [] },
    ],
};

const outputFile = './openapi.json';
const routes = ['./src/app.ts'];

// Generate OpenAPI spec
swaggerAutogen({ openapi: '3.0.0' })(outputFile, routes, doc).then(() => {
    console.log("Successfully generated openapi.json");
});
