import { PublicKey } from "@solana/web3.js";
import { getAllUserPositions } from "../../services/dlmmService";
import { getBalance } from "../../services/solanaService";
import { poolsInfoMessage } from "../components";

export const displayPositionListMenu = async (ctx) => {
  const telegram_id = ctx.from.id;
  const wallet = new PublicKey(ctx.session.walletAddress);
  let response;
  let buttons = [];

  try {
    ctx.session.positionList.balance = await getBalance(wallet);
    ctx.session.positionList.positions = await getAllUserPositions(wallet);

    if (
      ctx.session.positionList.positions &&
      ctx.session.positionList.positions.length > 0
    ) {
      response = poolsInfoMessage(ctx.session.positionList.positions);
    } else {
      response = "No positions available 🥲";
    }

    buttons.push([
      { text: "Back", callback_data: "back_position_list" },
      { text: "↻ Refresh", callback_data: "refresh_position_list" },
    ]);
  } catch (error) {
    console.error(`Error fetching positions: ${error.message}`);
  }

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

export async function setupPositionListActions(bot) {
  bot.action("back_position_list", (ctx) => {
    ctx.scene.enter("mainMenuScene");
  });
  bot.action("refresh_position_list", (ctx) => {
    displayPositionListMenu(ctx);
  });
}
