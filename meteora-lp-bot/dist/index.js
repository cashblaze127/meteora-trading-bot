"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const envResult = dotenv_1.default.config(); // Load environment variables from .env
if (envResult.error) {
    console.error("Failed to load .env file:", envResult.error);
    process.exit(1);
}
const bot_1 = require("./telegram/bot");
// Start MeteoraLP BOT
try {
    (0, bot_1.startBot)();
}
catch (error) {
    console.error("Failed to start Meteora LP BOT:", error);
    process.exit(1);
}
//# sourceMappingURL=index.js.map