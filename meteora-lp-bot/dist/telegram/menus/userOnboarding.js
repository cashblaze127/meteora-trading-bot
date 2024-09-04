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
exports.displayUserOnboardingMenu = void 0;
const displayUserOnboardingMenu = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const telegram_id = ctx.from.id;
    let response = `☄️ <b>ＭＥＴＥＯＲＡ  ＬＰ  ＡＲＭＹ</b> 🪐\n\n`;
    response += `<b>• 1.</b> Click on web button "☄️ Connect wallet". \n\n`;
    response += `<b>• 2.</b> Log in or sign up.\n\n`;
    response += `<b>• 3.</b> Click on "🔌 Sync wallet" button\n\n`;
    response += `<b>• 4.</b> That's all, logged in 🥳`;
    try {
        const webAppUrl = "https://meteora-react-dynamic-wallet.vercel.app/";
        if (ctx.callbackQuery && ctx.callbackQuery.message) {
            yield ctx.telegram.editMessageText(ctx.chat.id, ctx.callbackQuery.message.message_id, null, response, {
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
                parse_mode: "HTML",
                disable_web_page_preview: true,
            });
        }
        else {
            const sentMessage = yield ctx.reply(response, {
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
                parse_mode: "HTML",
                disable_web_page_preview: true,
            });
            ctx.session.mainMenu.messageId = sentMessage.message_id;
        }
    }
    catch (error) {
        console.error("Failed to edit or send message:", error);
    }
});
exports.displayUserOnboardingMenu = displayUserOnboardingMenu;
//# sourceMappingURL=userOnboarding.js.map