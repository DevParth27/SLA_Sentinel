import app from "./app";
import { testConnection } from "./db/client";

// Local development entry point — runs a long-lived HTTP server.
// On Vercel the app is served via server.ts as a serverless function instead.
const PORT = process.env.PORT || 8000;

app.listen(PORT, async () => {
  console.log(`🚀 SLA Sentinel backend running on port ${PORT}`);
  await testConnection();
});

export default app;
