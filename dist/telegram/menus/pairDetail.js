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
exports.displayPairDetailMenu = void 0;
exports.setupPairDetailActions = setupPairDetailActions;
const solana_1 = require("../../utils/solana");
const components_1 = require("../components");
const displayPairDetailMenu = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const telegram_id = ctx.from.id;
    let pairInfo;
    let response;
    try {
        ctx.session.pairDetail.pairInfo = yield (0, solana_1.getLbPairData)(ctx.session.pairDetail.positionId);
        response = (0, components_1.poolsCompleteInfoMessage)(ctx.session.pairDetail.pairInfo);
    }
    catch (error) {
        console.log("Error fetching token information:", error);
    }
    const buttons = [];
    buttons.push([
        { text: "Add liquidity", callback_data: "add_liquidity_pair_detail" },
    ]);
    buttons.push([
        { text: "Back", callback_data: "back_pair_detail" },
        { text: "↻ Refresh", callback_data: "refresh" },
    ]);
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
            yield ctx.reply(response, {
                reply_markup: {
                    inline_keyboard: buttons,
                },
                parse_mode: "HTML",
                disable_web_page_preview: true,
            });
        }
    }
    catch (error) {
        if (error.response &&
            error.response.error_code === 400 &&
            error.response.description ===
                "Bad Request: message is not modified: specified new message content and reply markup are exactly the same as a current content and reply markup of the message") {
            console.log("The message content is the same as before. No update needed.");
        }
        else if (error.response && error.response.error_code === 403) {
            console.log(`Bot was blocked by the user: ${telegram_id}`);
        }
        else {
            console.error("Failed to edit message:", error);
        }
    }
});
exports.displayPairDetailMenu = displayPairDetailMenu;
function resetData(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        ctx.session.addLiquidity = {
            strategyType: "Spot",
            isAutoFill: false,
            tokenPrice: "0",
            tokenSymbolX: "",
            tokenSymbolY: "",
            balanceTokenX: "0",
            balanceTokenY: "0",
            selectedBalanceX: "0",
            selectedBalanceY: "0",
            awaitingInput: "",
            messageId: "",
            requestMessageId: "",
        };
    });
}
function setupPairDetailActions(bot) {
    return __awaiter(this, void 0, void 0, function* () {
        bot.action("add_liquidity_pair_detail", (ctx) => __awaiter(this, void 0, void 0, function* () {
            yield resetData(ctx);
            ctx.scene.enter("addLiquidityScene");
        }));
        bot.action("back_pair_detail", (ctx) => {
            // Aquí, `mainMenuScene` es el nombre de la escena del menú principal.
            ctx.scene.enter("mainMenuScene");
        });
    });
}
//# sourceMappingURL=pairDetail.js.map