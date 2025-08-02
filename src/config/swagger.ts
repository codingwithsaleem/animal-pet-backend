// Swagger configuration for express-jsdoc-swagger

export const getSwaggerOptions = (BASE_URL: string, baseDir: string) => ({
  info: {
    version: '1.0.0',
    title: 'Rocket Cloud Portal API',
    description: 'API documentation for Rocket Cloud Portal',
  },
  security: {
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  },
  servers: [
    {
      url: `${BASE_URL}`,
      description: 'Development server',
    }
  ],
  baseDir: baseDir,
  filesPattern: ['./routes/v1/*.{ts,js}'], // scans all .ts and .js routes
  swaggerUIPath: '/api-docs/v1',
  exposeSwaggerUI: true,
  exposeApiDocs: false,
  notRequiredAsNullable: false,
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Rocket Cloud Portal API',
      version: '1.0.0',
      description: 'API documentation for Rocket Cloud Portal',
    },
    servers: [
      {
        url: `${BASE_URL}`,
        description: 'Development server',
      },
    ],
  },
});