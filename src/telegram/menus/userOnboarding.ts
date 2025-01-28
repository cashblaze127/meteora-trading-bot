export const displayUserOnboardingMenu = async (ctx) => {
  const telegram_id = ctx.from.id;

  let response = `☄️ <b>ＭＥＴＥＯＲＡ  ＬＰ  ＡＲＭＹ</b> 🪐\n\n`;
  response += `<b>• 1.</b> Click on web button "☄️ Connect wallet". \n\n`;
  response += `<b>• 2.</b> Log in or sign up.\n\n`;
  response += `<b>• 3.</b> Click on "🔌 Sync wallet" button\n\n`;
  response += `<b>• 4.</b> That's all, logged in 🥳`;

  try {
    const webAppUrl = "https://meteora-react-dynamic-wallet.vercel.app/";
    if (ctx.callbackQuery && ctx.callbackQuery.message) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        ctx.callbackQuery.message.message_id,
        null,
        response,
        {
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
        }
      );
    } else {
      const sentMessage = await ctx.reply(response, {
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
  } catch (error) {
    console.error("Failed to edit or send message:", error);
  }
};
