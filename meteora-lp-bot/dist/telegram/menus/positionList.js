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
exports.displayPositionListMenu = void 0;
exports.setupPositionListActions = setupPositionListActions;
const web3_js_1 = require("@solana/web3.js");
const dlmmService_1 = require("../../services/dlmmService");
const solanaService_1 = require("../../services/solanaService");
const components_1 = require("../components");
const displayPositionListMenu = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const telegram_id = ctx.from.id;
    const wallet = new web3_js_1.PublicKey(ctx.session.walletAddress);
    let response;
    let buttons = [];
    try {
        ctx.session.positionList.balance = yield (0, solanaService_1.getBalance)(wallet);
        ctx.session.positionList.positions = yield (0, dlmmService_1.getAllUserPositions)(wallet);
        if (ctx.session.positionList.positions &&
            ctx.session.positionList.positions.length > 0) {
            response = (0, components_1.poolsInfoMessage)(ctx.session.positionList.positions);
        }
        else {
            response = "No positions available 🥲";
        }
        buttons.push([
            { text: "Back", callback_data: "back_position_list" },
            { text: "↻ Refresh", callback_data: "refresh_position_list" },
        ]);
    }
    catch (error) {
        console.error(`Error fetching positions: ${error.message}`);
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
exports.displayPositionListMenu = displayPositionListMenu;
function setupPositionListActions(bot) {
    return __awaiter(this, void 0, void 0, function* () {
        bot.action("back_position_list", (ctx) => {
            ctx.scene.enter("mainMenuScene");
        });
        bot.action("refresh_position_list", (ctx) => {
            (0, exports.displayPositionListMenu)(ctx);
        });
    });
}
//# sourceMappingURL=positionList.js.map