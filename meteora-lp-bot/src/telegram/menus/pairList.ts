import { searchPairByGroup } from "../../utils/solana";
import { pairListMessage } from "../components";

export const displayPairListMenu = async (ctx) => {
  const telegram_id = ctx.from.id;
  console.log("🚀 ~ text ~ text");
  const userInput = ctx.session.pairList.userInput;
  console.log("🚀 ~ displayPairListMenu ~ userInput:", userInput);
  const page = ctx.session.pairList.page || 0;
  const itemsPerPage = 5;
  const currentPage = ctx.session.pairList.page || 0;

  const pairResponse = await searchPairByGroup(
    ctx.session.pairList.userInput,
    page,
    itemsPerPage
  );
  const totalItems = pairResponse.total;

  // Add pool information message
  const response = pairListMessage(pairResponse);

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
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        ctx.callbackQuery.message.message_id,
        null,
        response,
        {
          reply_markup: {
            inline_keyboard: buttons,
          },
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }
      );
    } else {
      await ctx.reply(response, {
        reply_markup: {
          inline_keyboard: buttons,
        },
        parse_mode: "HTML",
        disable_web_page_preview: true,
      });
    }
  } catch (error) {
    if (
      error.response &&
      error.response.error_code === 400 &&
      error.response.description ===
        "Bad Request: message is not modified: specified new message content and reply markup are exactly the same as a current content and reply markup of the message"
    ) {
      console.log(
        "The message content is the same as before. No update needed."
      );
    } else if (error.response && error.response.error_code === 403) {
      console.log(`Bot was blocked by the user: ${telegram_id}`);
    } else {
      console.error("Failed to edit message:", error);
    }
  }
};

export async function setupPairListActions(bot) {
  bot.action("previous_list", async (ctx) => {
    ctx.session.pairList.page =
      ctx.session.pairList.page > 0 ? ctx.session.pairList.page - 1 : 0;
    await displayPairListMenu(ctx);
  });

  bot.action("next_list", async (ctx) => {
    if (typeof ctx.session.pairList.page !== "number") {
      ctx.session.pairList.page = 0;
    }
    console.log("ctx.session.pairList.page", ctx.session.pairList.page);
    ctx.session.pairList.page = ctx.session.pairList.page + 1;
    console.log("ctx.session.pairList.page", ctx.session.pairList.page);
    await displayPairListMenu(ctx);
  });

  bot.action("back_pair_list", async (ctx) => {
    ctx.scene.enter("mainMenuScene");
  });
}
