import app from "../src/app";

// Vercel serverless entry: export the Express app as the request handler
// instead of calling app.listen() (Vercel manages the port).
export default app;