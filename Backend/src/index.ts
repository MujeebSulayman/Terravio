import { loadEnv } from "./config/env";
import { createApp } from "./app";

const env = loadEnv();
const app = createApp(env);

app.listen(env.PORT, () => {
  console.log(`Terravio API listening on :${env.PORT} (${env.NODE_ENV})`);
});
