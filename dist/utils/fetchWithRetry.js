"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = void 0;
exports.fetchWithRetry = fetchWithRetry;
const MAX_BATCH_SIZE = 1000;
const MAX_RETRIES = 10;
const INITIAL_RETRY_DELAY = 1000;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
exports.delay = delay;
class RateLimiter {
    constructor(callsPerSecond) {
        this.queue = [];
        this.isProcessing = false;
        this.lastCallTime = 0;
        this.callInterval = 0;
        this.callInterval = 1000 / callsPerSecond;
    }
    limit() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                this.queue.push(resolve);
                if (!this.isProcessing) {
                    this.processQueue();
                }
            });
        });
    }
    processQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            this.isProcessing = true;
            while (this.queue.length > 0) {
                const now = Date.now();
                const timeToWait = Math.max(0, this.lastCallTime + this.callInterval - now);
                if (timeToWait > 0) {
                    yield (0, exports.delay)(timeToWait);
                }
                this.lastCallTime = Date.now();
                const next = this.queue.shift();
                if (next) {
                    next();
                }
            }
            this.isProcessing = false;
        });
    }
}
const rateLimiter = new RateLimiter(10);
function fetchWithRetry(fetchFunc_1) {
    return __awaiter(this, arguments, void 0, function* (fetchFunc, options = {}) {
        const { maxRetries = MAX_RETRIES, initialDelay = INITIAL_RETRY_DELAY, useRateLimiter = false, } = options;
        for (let retries = 0; retries < maxRetries; retries++) {
            try {
                if (useRateLimiter) {
                    yield rateLimiter.limit();
                }
                return yield fetchFunc();
            }
            catch (error) {
                if (retries === maxRetries - 1) {
                    console.error("Max retries reached, throwing error", error);
                    throw error;
                }
                const baseDelay = initialDelay * Math.pow(2, retries);
                const jitter = 500 * (1 + Math.random());
                const delayTime = Math.floor(baseDelay + jitter);
                const timestamp = new Date().toISOString();
                console.warn(`[${timestamp}] Retry attempt ${retries + 1} after ${delayTime}ms delay`);
                yield (0, exports.delay)(delayTime);
            }
        }
        throw new Error("Max retries reached");
    });
}
//# sourceMappingURL=fetchWithRetry.js.map