import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";

// Listen first so /health is ready immediately; MongoDB (dashboard only) connects in the background.
app.listen(env.PORT, env.HOST, () => {
  console.log(`[server] listening on http://${env.HOST}:${env.PORT}`);
});

connectDB();
