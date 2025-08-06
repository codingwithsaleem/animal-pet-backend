import 'module-alias/register';
import "dotenv-flow/config";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import expressJSDocSwagger from 'express-jsdoc-swagger';
import v1Router from "./routes/v1";
import healthRouter from "./routes/health.router";
import express, { NextFunction } from "express";
import { errorMiddleware, notFoundHandler } from "../packages/error-handaler/error-middleware";
import { getSwaggerOptions } from "./config/swagger";

const app = express();
const PORT = process.env.APP_PORT || 6001; // Default to 6001 if not set
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}/api/v1`;

// Swagger configuration
const swaggerOptions = getSwaggerOptions(BASE_URL, __dirname);
expressJSDocSwagger(app)(swaggerOptions);

// CORS middleware with enhanced error handling support
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:6001",
      "http://localhost:3001",
      "https://tlztdz38-6001.inc1.devtunnels.ms"
    ],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.set("trust proxy", 1);

// Middleware
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" })); // Reduced from 100mb for security
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Routes
app.use("/health", healthRouter);
app.use("/api/v1", v1Router);


// Handle 404 for unmatched routes
app.use(notFoundHandler);

// Global error handling middleware (must be last)
app.use(errorMiddleware);

const server = app.listen(PORT, async () => {
  console.log(`🚀 Server listening at http://localhost:${PORT}`);
  console.log(`📚 Swagger docs available at http://localhost:${PORT}/api-docs/v1`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle server errors
server.on("error", (error) => {
  console.error("❌ Server error:", error);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  
  server.close(() => {
    console.log('Process terminated');
  });
});
