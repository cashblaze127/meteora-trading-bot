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
exports.displayPairListMenu = void 0;
exports.setupPairListActions = setupPairListActions;
const solana_1 = require("../../utils/solana");
const components_1 = require("../components");
const displayPairListMenu = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const telegram_id = ctx.from.id;
    console.log("🚀 ~ text ~ text");
    const userInput = ctx.session.pairList.userInput;
    console.log("🚀 ~ displayPairListMenu ~ userInput:", userInput);
    const page = ctx.session.pairList.page || 0;
    const itemsPerPage = 5;
    const currentPage = ctx.session.pairList.page || 0;
    const pairResponse = yield (0, solana_1.searchPairByGroup)(ctx.session.pairList.userInput, page, itemsPerPage);
    const totalItems = pairResponse.total;
    // Add pool information message
    const response = (0, components_1.pairListMessage)(pairResponse);
    const buttons = [];
    const navigationButtons = [];
    if (currentPage > 0) {
        navigationButtons.push({
            text: "⬅️ Previous",
            callback_data: "previous_list",
        });
    }
    if ((currentPage + 1) * itemsPerPage < totalItems) {
        navigationButtons.push({ text: "Next ➡️", callback_data: "next_list" });
    }
    // If there are navigation buttons, add them in the same row.
    if (navigationButtons.length > 0) {
        buttons.push(navigationButtons);
    }
    // Adds the “Back” button in a new row
    buttons.push([{ text: "Back", callback_data: "back_pair_list" }]);
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
exports.displayPairListMenu = displayPairListMenu;
function setupPairListActions(bot) {
    return __awaiter(this, void 0, void 0, function* () {
        bot.action("previous_list", (ctx) => __awaiter(this, void 0, void 0, function* () {
            ctx.session.pairList.page =
                ctx.session.pairList.page > 0 ? ctx.session.pairList.page - 1 : 0;
            yield (0, exports.displayPairListMenu)(ctx);
        }));
        bot.action("next_list", (ctx) => __awaiter(this, void 0, void 0, function* () {
            if (typeof ctx.session.pairList.page !== "number") {
                ctx.session.pairList.page = 0;
            }
            console.log("ctx.session.pairList.page", ctx.session.pairList.page);
            ctx.session.pairList.page = ctx.session.pairList.page + 1;
            console.log("ctx.session.pairList.page", ctx.session.pairList.page);
            yield (0, exports.displayPairListMenu)(ctx);
        }));
        bot.action("back_pair_list", (ctx) => __awaiter(this, void 0, void 0, function* () {
            ctx.scene.enter("mainMenuScene");
        }));
    });
}
//# sourceMappingURL=pairList.js.map