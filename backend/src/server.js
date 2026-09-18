import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";

connectDB()
  .then(() => {
    app.listen(env.PORT, () => {
      console.log(`[server] listening on http://localhost:${env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("[server] failed to start", err);
    process.exit(1);
  });
