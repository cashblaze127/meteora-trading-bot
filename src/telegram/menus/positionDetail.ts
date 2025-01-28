import { getLbPairWithPositionData } from "../../utils/solana";
import { poolsCompletePositionInfoMessage } from "../components";

import { closePosition } from "../../services/dlmmService";
import { PublicKey } from "@solana/web3.js";

export const displayPositionDetailMenu = async (ctx) => {
  const telegram_id = ctx.from.id;
  let position;
  let response;
  const buttons = [];

  try {
    position = ctx.session.mainMenu.positions.find(
      (p) => p.poolKey === ctx.session.positionDetail.positionId
    );
    console.log("🚀 ~ displayPositionDetailMenu ~ position:", position);

    if (position) {
      ctx.session.positionDetail.positionWithPairInfo =
        await getLbPairWithPositionData(position);
      // Add pool information message with LB-Pair pair data
      response = poolsCompletePositionInfoMessage(
        ctx.session.positionDetail.positionWithPairInfo
      );
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
  } catch (error) {
    console.log("Error finding position in session", error);
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

export async function setupPositionDetailActions(bot) {
  bot.action("back_position_detail", (ctx) => {
    ctx.scene.enter("mainMenuScene");
  });

  bot.action("withdraw_close_position", async (ctx) => {
    try {
      const user = new PublicKey(ctx.session.walletAddress);
      const encodedTx = await closePosition(
        ctx.session.positionDetail.positionWithPairInfo.dlmmPool,
        user
      );

      if (encodedTx) {
        console.log("encodedTx: ", encodedTx);
        const encodedData = encodeURIComponent(encodedTx);
        const webAppUrl = `https://meteora-react-dynamic-wallet.vercel.app?transaction=${encodedData}`;

        await ctx.reply(`☄️ Transaction is ready to be signed!`, {
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
    } catch (error) {
      ctx.reply(`‼️ An error occurred while closing the position`);
    }
  });
  bot.action("refresh_position_detail", async (ctx) => {
    try {
      displayPositionDetailMenu(ctx);
    } catch (error) {
      console.log(
        `An error occurred while refreshing position details:`,
        error
      );
    }
  });
}
