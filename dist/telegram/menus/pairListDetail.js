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
exports.displayPairListDetailMenu = void 0;
exports.setupPairListDetailActions = setupPairListDetailActions;
const solana_1 = require("../../utils/solana");
const components_1 = require("../components");
const displayPairListDetailMenu = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const telegram_id = ctx.from.id;
    console.log("🚀 ~ text ~ text");
    const userInput = ctx.session.pairListDetail.userInput;
    console.log("🚀 ~ displayPairListMenu ~ userInput:", userInput);
    const pairNameSelected = ctx.session.pairListDetail.pairNameSelected;
    const page = ctx.session.pairListDetail.pageListDetail || 0;
    const itemsPerPage = 5;
    // Service to obtain all pairs
    const pairResponse = yield (0, solana_1.searchPairByGroup)(pairNameSelected, 0, 1);
    let pairs;
    let end;
    let response;
    if (!pairResponse.groups ||
        pairResponse.groups.length === 0 ||
        !pairResponse.groups[0].pairs ||
        pairResponse.groups[0].pairs.length === 0) {
        response = "No pairs available 🥲";
    }
    else {
        pairs = pairResponse.groups[0].pairs;
        console.log("🚀 ~ displayPairListDetailMenu ~ total pairs:", pairs.length);
        // We implement pagination by dividing the array into pages of 5 elements.
        const start = page * itemsPerPage;
        end = start + itemsPerPage;
        console.log("🚀 ~ displayPairListDetailMenu ~ start:", start);
        console.log("🚀 ~ displayPairListDetailMenu ~ end:", end);
        // If `start` is greater than or equal to the number of peers, we reset the page
        if (start >= pairs.length) {
            ctx.session.pairListDetail.pageListDetail = Math.max(0, Math.floor(pairs.length / itemsPerPage) - 1);
            yield (0, exports.displayPairListDetailMenu)(ctx);
            return;
        }
        const pairsToDisplay = pairs.slice(start, end);
        console.log("🚀 ~ displayPairListDetailMenu ~ pairsToDisplay:", pairsToDisplay);
        if (pairsToDisplay.length === 0) {
            response = "No more pairs available.";
        }
        else {
            response = (0, components_1.pairListDetailMessage)(pairsToDisplay);
        }
    }
    const buttons = [];
    const paginationButtons = [];
    // Previous button only if we are not on the first page.
    if (page > 0) {
        paginationButtons.push({
            text: "⬅️ Previous",
            callback_data: "previous_list_detail",
        });
    }
    // Next button only if we are not on the last page.
    if (pairs && end < pairs.length) {
        paginationButtons.push({
            text: "Next ➡️",
            callback_data: "next_list_detail",
        });
    }
    // Add pagination buttons if any
    if (paginationButtons.length > 0) {
        buttons.push(paginationButtons); // Ambos botones estarán en la misma línea
    }
    buttons.push([{ text: "Back", callback_data: "back_pair_list_detail" }]);
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
exports.displayPairListDetailMenu = displayPairListDetailMenu;
function setupPairListDetailActions(bot) {
    return __awaiter(this, void 0, void 0, function* () {
        bot.action("previous_list_detail", (ctx) => __awaiter(this, void 0, void 0, function* () {
            ctx.session.pairListDetail.pageListDetail =
                ctx.session.pairListDetail.pageListDetail > 0
                    ? ctx.session.pairListDetail.pageListDetail - 1
                    : 0;
            yield (0, exports.displayPairListDetailMenu)(ctx);
        }));
        bot.action("next_list_detail", (ctx) => __awaiter(this, void 0, void 0, function* () {
            if (typeof ctx.session.pairListDetail.pageListDetail !== "number") {
                ctx.session.pairListDetail.pageListDetail = 0;
            }
            ctx.session.pairListDetail.pageListDetail =
                ctx.session.pairListDetail.pageListDetail + 1;
            yield (0, exports.displayPairListDetailMenu)(ctx);
        }));
        bot.action("back_pair_list_detail", (ctx) => __awaiter(this, void 0, void 0, function* () {
            ctx.scene.enter("pairScene");
        }));
    });
}
//# sourceMappingURL=pairListDetail.js.map