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
exports.displayMainMenu = void 0;
exports.setupMainActions = setupMainActions;
exports.searchPoolInput = searchPoolInput;
const dlmmService_1 = require("../../services/dlmmService");
const solanaService_1 = require("../../services/solanaService");
const components_1 = require("../components");
const web3_js_1 = require("@solana/web3.js");
const displayMainMenu = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const telegram_id = ctx.from.id;
    const wallet = new web3_js_1.PublicKey(ctx.session.walletAddress);
    const formattedWalletAddress = `${wallet.toBase58().slice(0, 4)}...${wallet
        .toBase58()
        .slice(-4)}`;
    // Inicializamos los valores de balance y posiciones
    ctx.session.mainMenu.balance = "";
    ctx.session.mainMenu.balance = yield (0, solanaService_1.getBalance)(wallet);
    ctx.session.mainMenu.positions = yield (0, dlmmService_1.getAllUserPositions)(wallet, 3);
    let response = `☄️ <b>ＭＥＴＥＯＲＡ  ＬＰ  ＡＲＭＹ</b> 🪐\n\n<code>${wallet.toBase58()}</code>\n\n`;
    response += `<b>Balance</b>: <code>${ctx.session.mainMenu.balance}</code> SOL\n\n`;
    response += `<b>Positions</b> (${ctx.session.mainMenu.positions.length} / 3)\n`;
    response += (0, components_1.poolsInfoMessage)(ctx.session.mainMenu.positions);
    const buttons = [];
    buttons.push([
        { text: "Create pool", callback_data: "create_pool" },
        { text: "Positions", callback_data: "positions" },
        { text: "Swap", callback_data: "swap" },
    ]);
    buttons.push([{ text: "Search pools", callback_data: "search_pools" }]);
    buttons.push([
        { text: "Info", callback_data: "info" },
        { text: "Settings", callback_data: "settings" },
    ]);
    buttons.push([{ text: "↻ Refresh", callback_data: "refresh_main" }]);
    try {
        if (ctx.callbackQuery && ctx.callbackQuery.message) {
            yield ctx.telegram.editMessageText(ctx.chat.id, ctx.callbackQuery.message.message_id, null, response, {
                reply_markup: {
                    inline_keyboard: buttons,
                },
                parse_mode: "HTML",
                disable_web_page_preview: true,
            });
        }
        else {
            const sentMessage = yield ctx.reply(response, {
                reply_markup: {
                    inline_keyboard: buttons,
                    resize_keyboard: true,
                    one_time_keyboard: false,
                },
                parse_mode: "HTML",
                disable_web_page_preview: true,
            });
            ctx.session.mainMenu.messageId = sentMessage.message_id;
        }
        // Después de enviar el mensaje inline, envía el botón `web_app` en el teclado regular
        const webAppUrl = "https://meteora-react-dynamic-wallet.vercel.app/";
        yield ctx.reply("🔌 Wallet updated", {
            reply_markup: {
                keyboard: [
                    [
                        {
                            text: `☄️ Wallet connected ${formattedWalletAddress}`,
                            web_app: { url: webAppUrl },
                        },
                    ],
                ],
                resize_keyboard: true,
                one_time_keyboard: false,
            },
        });
    }
    catch (error) {
        console.error("Failed to edit or send message:", error);
    }
});
exports.displayMainMenu = displayMainMenu;
function setupMainActions(bot) {
    return __awaiter(this, void 0, void 0, function* () {
        bot.action("search_pools", (ctx) => __awaiter(this, void 0, void 0, function* () {
            ctx.reply("🔍 Search by token name, symbol, mint:");
            ctx.session.awaitingInput = "search_pools";
        }));
        bot.action("positions", (ctx) => {
            ctx.scene.enter("positionListScene");
        });
        bot.action("refresh_main", (ctx) => __awaiter(this, void 0, void 0, function* () {
            (0, exports.displayMainMenu)(ctx);
        }));
    });
}
function searchPoolInput(ctx, awaitingInput) {
    return __awaiter(this, void 0, void 0, function* () {
        if (awaitingInput === "search_pools") {
            ctx.session.pairList.userInput = ctx.message.text;
            console.log(`User input: ${ctx.session.pairList.userInput}`);
            yield ctx.scene.enter("pairScene");
        }
    });
}
//# sourceMappingURL=main.js.map