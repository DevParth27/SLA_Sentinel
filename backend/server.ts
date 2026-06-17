// Vercel serverless entry point.
// vercel.json routes every request here; Express handles internal routing.
// The default export is the Express app, which is itself a (req, res) handler.
import app from "./app";

export default app;
