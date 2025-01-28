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
exports.displayPositionDetailMenu = void 0;
exports.setupPositionDetailActions = setupPositionDetailActions;
const solana_1 = require("../../utils/solana");
const components_1 = require("../components");
const dlmmService_1 = require("../../services/dlmmService");
const web3_js_1 = require("@solana/web3.js");
const displayPositionDetailMenu = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const telegram_id = ctx.from.id;
    let position;
    let response;
    const buttons = [];
    try {
        position = ctx.session.mainMenu.positions.find((p) => p.poolKey === ctx.session.positionDetail.positionId);
        console.log("🚀 ~ displayPositionDetailMenu ~ position:", position);
        if (position) {
            ctx.session.positionDetail.positionWithPairInfo =
                yield (0, solana_1.getLbPairWithPositionData)(position);
            // Add pool information message with LB-Pair pair data
            response = (0, components_1.poolsCompletePositionInfoMessage)(ctx.session.positionDetail.positionWithPairInfo);
        }
        buttons.push([{ text: "Add liquidity", callback_data: "add_liquidity" }]);
        buttons.push([
            { text: "Withdraw liquidity", callback_data: "withdraw_liquidity" },
            {
                text: "Withdraw & Close position",
                callback_data: "withdraw_close_position",
            },
        ]);
        buttons.push([
            { text: "⬅️ Back", callback_data: "back_position_detail" },
            { text: "↻ Refresh", callback_data: "refresh_position_detail" },
        ]);
    }
    catch (error) {
        console.log("Error finding position in session", error);
    }
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
exports.displayPositionDetailMenu = displayPositionDetailMenu;
function setupPositionDetailActions(bot) {
    return __awaiter(this, void 0, void 0, function* () {
        bot.action("back_position_detail", (ctx) => {
            ctx.scene.enter("mainMenuScene");
        });
        bot.action("withdraw_close_position", (ctx) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = new web3_js_1.PublicKey(ctx.session.walletAddress);
                const encodedTx = yield (0, dlmmService_1.closePosition)(ctx.session.positionDetail.positionWithPairInfo.dlmmPool, user);
                if (encodedTx) {
                    console.log("encodedTx: ", encodedTx);
                    const encodedData = encodeURIComponent(encodedTx);
                    const webAppUrl = `https://meteora-react-dynamic-wallet.vercel.app?transaction=${encodedData}`;
                    yield ctx.reply(`☄️ Transaction is ready to be signed!`, {
                        reply_markup: {
                            keyboard: [
                                [
                                    {
                                        text: "✍🏻 Sign transaction",
                                        web_app: {
                                            url: webAppUrl,
                                        },
                                    },
                                ],
                            ],
                            resize_keyboard: true,
                            one_time_keyboard: false,
                        },
                        parse_mode: "HTML",
                        disable_web_page_preview: true,
                    });
                }
            }
            catch (error) {
                ctx.reply(`‼️ An error occurred while closing the position`);
            }
        }));
        bot.action("refresh_position_detail", (ctx) => __awaiter(this, void 0, void 0, function* () {
            try {
                (0, exports.displayPositionDetailMenu)(ctx);
            }
            catch (error) {
                console.log(`An error occurred while refreshing position details:`, error);
            }
        }));
    });
}
//# sourceMappingURL=positionDetail.js.map