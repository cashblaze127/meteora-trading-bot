import dotenv from "dotenv";
const envResult = dotenv.config(); // Load environment variables from .env

if (envResult.error) {
  console.error("Failed to load .env file:", envResult.error);
  process.exit(1);
}

import { startBot } from "./telegram/bot";

// Start MeteoraLP BOT
try {
  startBot();
} catch (error) {
  console.error("Failed to start Meteora LP BOT:", error);
  process.exit(1);
}
