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
exports.addLiquidityScene = exports.pairDetailScene = exports.pairListDetailScene = exports.pairListScene = exports.positionListScene = exports.positionDetailScene = exports.mainMenuScene = exports.userOnboarding = void 0;
exports.initializeBot = initializeBot;
exports.startBot = startBot;
const telegraf_1 = require("telegraf");
const main_1 = require("./menus/main");
const positionDetail_1 = require("./menus/positionDetail");
const positionList_1 = require("./menus/positionList");
const pairList_1 = require("./menus/pairList");
const pairListDetail_1 = require("./menus/pairListDetail");
const pairDetail_1 = require("./menus/pairDetail");
const addLiquidity_1 = require("./menus/addLiquidity");
const userOnboarding_1 = require("./menus/userOnboarding");
let bot = undefined;
exports.userOnboarding = new telegraf_1.Scenes.BaseScene("userOnboarding");
exports.mainMenuScene = new telegraf_1.Scenes.BaseScene("mainMenuScene");
exports.positionDetailScene = new telegraf_1.Scenes.BaseScene("positionDetailScene");
exports.positionListScene = new telegraf_1.Scenes.BaseScene("positionListScene");
exports.pairListScene = new telegraf_1.Scenes.BaseScene("pairScene");
exports.pairListDetailScene = new telegraf_1.Scenes.BaseScene("pairListDetailScene");
exports.pairDetailScene = new telegraf_1.Scenes.BaseScene("pairDetailScene");
exports.addLiquidityScene = new telegraf_1.Scenes.BaseScene("addLiquidityScene");
function initializeBot() {
    return __awaiter(this, void 0, void 0, function* () {
        if (bot) {
            return bot;
        }
        bot = new telegraf_1.Telegraf(process.env.BOT_TOKEN);
        const stage = new telegraf_1.Scenes.Stage([
            exports.userOnboarding,
            exports.mainMenuScene,
            exports.positionDetailScene,
            exports.positionListScene,
            exports.pairListScene,
            exports.pairListDetailScene,
            exports.pairDetailScene,
            exports.addLiquidityScene,
        ], {
            ttl: 10,
        });
        bot.use((0, telegraf_1.session)());
        bot.use(stage.middleware());
        // Middleware to initialize session data
        bot.use((ctx, next) => __awaiter(this, void 0, void 0, function* () {
            yield initSessionData(ctx);
            return next();
        }));
        bot.on("web_app_data", (ctx) => __awaiter(this, void 0, void 0, function* () {
            try {
                const message = ctx.message.web_app_data.data;
                console.log(message);
                if (message.startsWith("auth_")) {
                    const walletId = message.replace("auth_", "");
                    console.log("✅ Wallet connected:", walletId);
                    ctx.session.walletAddress = walletId;
                    ctx.scene.enter("mainMenuScene");
                }
                if (message === "logout") {
                    ctx.session.walletAddress = undefined;
                    const webAppUrl = "https://meteora-react-dynamic-wallet.vercel.app/";
                    yield ctx.reply("✅ Logout", {
                        reply_markup: {
                            keyboard: [
                                [
                                    {
                                        text: "☄️ Connect wallet",
                                        web_app: {
                                            url: webAppUrl,
                                        },
                                    },
                                ],
                            ],
                            resize_keyboard: true,
                            one_time_keyboard: false,
                        },
                    });
                }
                // Check if the message contains a Solscan URL
                const solscanUrlRegex = /https:\/\/solscan\.io\/tx\/[a-zA-Z0-9]+/;
                const match = message.match(solscanUrlRegex);
                if (match) {
                    const solscanUrl = match[0];
                    //`🪐 <b>Successfully</b> closed position with claimed fees🥳\n${solscanUrl}`
                    //`🪐 <b>Successfully</b> added liquidity to pool 🥳\n${solscanUrl}`
                    yield ctx.reply(`🪐 <b>Successfully</b> added liquidity to pool 🥳\n${solscanUrl}`, {
                        parse_mode: "HTML",
                    });
                }
            }
            catch (error) {
                console.error("Error handling the Web App data:", error);
            }
        }));
        bot.start((ctx) => __awaiter(this, void 0, void 0, function* () {
            const startParam = ctx.message.text.split(" ")[1];
            if (ctx.session.walletAddress === undefined) {
                ctx.scene.enter("userOnboarding");
                return;
            }
            if (startParam && startParam.startsWith("position_")) {
                ctx.session.positionDetail.positionId = startParam.split("_")[1];
                ctx.scene.enter("positionDetailScene");
            }
            if (startParam && startParam.startsWith("pair_")) {
                ctx.session.pairDetail.positionId = startParam.split("_")[1];
                ctx.scene.enter("pairDetailScene");
            }
            if (startParam && startParam.startsWith("pairListDetail_")) {
                const pairName = startParam.split("_")[1];
                ctx.session.pairListDetail.pairNameSelected = pairName;
                ctx.scene.enter("pairListDetailScene");
            }
            if (!startParam) {
                ctx.scene.enter("mainMenuScene");
            }
        }));
        yield (0, main_1.setupMainActions)(bot);
        yield (0, positionDetail_1.setupPositionDetailActions)(bot);
        yield (0, positionList_1.setupPositionListActions)(bot);
        yield (0, pairListDetail_1.setupPairListDetailActions)(bot);
        yield (0, pairList_1.setupPairListActions)(bot);
        yield (0, pairDetail_1.setupPairDetailActions)(bot);
        yield (0, addLiquidity_1.setupAddLiquidityActions)(bot);
        yield handleInputMessages(bot);
        yield console.log(`
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⣿⡟⡿⢯⡻⡝⢯⡝⡾⣽⣻⣟⡿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢻⠳⣏⠧⠹⡘⢣⠑⠎⠱⣈⠳⢡⠳⢭⣛⠷⣟⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⣝⣎⢣⠡⠌⣢⠧⠒⠃⠁⠈⠉⠉⠑⠓⠚⠦⣍⡞⡽⣞⡿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⣝⠮⡜⣢⠕⠊⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠐⠄⡙⠲⣝⡺⡽⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⣿⣿⡹⢎⣳⠞⡡⠊⠀⠀⠀⣀⣤⣤⣶⣶⣤⣤⣀⡈⠂⠄⠙⠱⡌⠳⣹⢎⡿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⣽⣟⣳⡝⡼⢁⠎⠀⡀⢁⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⡄⠰⣄⠈⠓⢌⠛⢽⣣⡟⢿⠿⣿⣿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⡿⣽⠳⡼⢁⡞⠀⡜⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡆⢸⢵⠀⠀⠁⠂⠤⣉⠉⠓⠒⠚⠦⠥⡈⠉⣙⢛⡿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⡾⣽⣏⢳⢃⣞⠃⡼⢀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡄⠀⠀⠀⠀⠀⠀⠀⠀⠁⢀⣀⠤⠐⢋⡰⣌⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⣮⢳⣿⠶⠁⠖⠃⠀⠁⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠿⠿⠟⠛⠛⠀⠀⠀⠀⢀⡤⠤⠐⠒⣉⠡⣄⠶⣭⣿⣽⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⡿⠿⢉⡢⠝⠁⠀⠃⠀⠀⠀⠀⠀⠿⠃⠿⠿⠿⠛⠋⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⠀⣀⢤⣰⣲⣽⣾⡟⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣟⡿⡚⠏⠁⠀⠐⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠂⣠⠀⣯⣗⣮⢿⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⢯⡝⠠⠁⠀⠀⠠⠤⠀⠀⠀⠀⡀⠢⣄⣀⡀⠐⠤⡀⠀⠀⠀⢤⣄⣀⠤⣄⣤⢤⣖⡾⠋⢁⡼⠁⣸⡿⣞⣽⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣷⣾⣵⣦⣶⣖⣳⣶⣝⣶⣯⣷⣽⣷⣾⣶⣽⣯⣶⠄⠈⠒⣤⣀⠉⠙⠛⠛⠋⠋⢁⣠⠔⠁⠀⢰⣿⣽⣯⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣦⡄⡀⡉⠛⠓⠶⠶⠒⠛⠋⠀⠀⢀⣼⣻⢷⣾⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣾⣧⡵⣌⣒⢂⠀⣀⣀⣠⣤⣶⣿⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣿⣾⣷⣯⣿⣧⣿⣷⣿⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿`);
        return bot;
    });
}
function handleInputMessages(bot) {
    return __awaiter(this, void 0, void 0, function* () {
        bot.hears(/.*/, (ctx) => __awaiter(this, void 0, void 0, function* () {
            const awaitingInput = ctx.session.awaitingInput;
            yield (0, main_1.searchPoolInput)(ctx, awaitingInput);
            yield (0, addLiquidity_1.setCustomAmountInput)(ctx, awaitingInput);
        }));
    });
}
function initSessionData(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        ctx.session.mainMenu = ctx.session.mainMenu || {
            balance: "0",
            positions: [],
            userInput: "",
        };
        ctx.session.positionDetail = ctx.session.positionDetail || {
            positionId: "",
            positionWithPairInfo: null,
            positions: [],
        };
        ctx.session.positionList = ctx.session.positionList || {
            balance: "0",
            positions: [],
        };
        ctx.session.pairList = ctx.session.pairList || {
            userInput: "",
            page: 0,
        };
        ctx.session.pairListDetail = ctx.session.pairListDetail || {
            userInput: "",
            pairNameSelected: "",
            pageListDetail: 0,
        };
        ctx.session.pairDetail = ctx.session.pairDetail || {
            positionId: "",
            pairInfo: null,
        };
        ctx.session.addLiquidity = ctx.session.addLiquidity || {
            strategyType: "Spot",
            isAutoFill: false,
            tokenPrice: "0",
            tokenSymbolX: "",
            tokenSymbolY: "",
            balanceTokenX: "0",
            balanceTokenY: "0",
            selectedBalanceX: "0",
            selectedBalanceY: "0",
            messageId: "",
            requestMessageId: "",
        };
        ctx.session.awaitingInput = ctx.session.awaitingInput || "";
        ctx.session.walletAddress = ctx.session.walletAddress || undefined;
    });
}
function startBot() {
    return __awaiter(this, void 0, void 0, function* () {
        const initializedBot = yield initializeBot();
        // Scene configuration only after the bot is initialized
        exports.userOnboarding.enter((ctx) => __awaiter(this, void 0, void 0, function* () {
            yield (0, userOnboarding_1.displayUserOnboardingMenu)(ctx);
        }));
        exports.mainMenuScene.enter((ctx) => __awaiter(this, void 0, void 0, function* () {
            yield (0, main_1.displayMainMenu)(ctx);
        }));
        exports.positionDetailScene.enter((ctx) => __awaiter(this, void 0, void 0, function* () {
            yield (0, positionDetail_1.displayPositionDetailMenu)(ctx);
        }));
        exports.positionListScene.enter((ctx) => __awaiter(this, void 0, void 0, function* () {
            yield (0, positionList_1.displayPositionListMenu)(ctx);
        }));
        exports.pairListScene.enter((ctx) => __awaiter(this, void 0, void 0, function* () {
            yield (0, pairList_1.displayPairListMenu)(ctx);
        }));
        exports.pairListDetailScene.enter((ctx) => __awaiter(this, void 0, void 0, function* () {
            yield (0, pairListDetail_1.displayPairListDetailMenu)(ctx);
        }));
        exports.pairDetailScene.enter((ctx) => __awaiter(this, void 0, void 0, function* () {
            yield (0, pairDetail_1.displayPairDetailMenu)(ctx);
        }));
        exports.addLiquidityScene.enter((ctx) => __awaiter(this, void 0, void 0, function* () {
            yield (0, addLiquidity_1.displayAddLiquidityMenu)(ctx);
        }));
        yield initializedBot.launch(); // Launch bot on safe mode
        // Graceful shutdown handling
        process.once("SIGINT", () => {
            console.log("SIGINT received. Stopping bot...");
            initializedBot.stop("SIGINT");
        });
        process.once("SIGTERM", () => {
            console.log("SIGTERM received. Stopping bot...");
            initializedBot.stop("SIGTERM");
        });
    });
}
//# sourceMappingURL=bot.js.map