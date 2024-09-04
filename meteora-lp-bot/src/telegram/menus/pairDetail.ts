import { getLbPairData } from "../../utils/solana";
import { poolsCompleteInfoMessage } from "../components";

export const displayPairDetailMenu = async (ctx) => {
  const telegram_id = ctx.from.id;
  let pairInfo;
  let response;

  try {
    ctx.session.pairDetail.pairInfo = await getLbPairData(
      ctx.session.pairDetail.positionId
    );
    response = poolsCompleteInfoMessage(ctx.session.pairDetail.pairInfo);
  } catch (error) {
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

async function resetData(ctx) {
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
}

export async function setupPairDetailActions(bot) {
  bot.action("add_liquidity_pair_detail", async (ctx) => {
    await resetData(ctx);
    ctx.scene.enter("addLiquidityScene");
  });

  bot.action("back_pair_detail", (ctx) => {
    // Aquí, `mainMenuScene` es el nombre de la escena del menú principal.
    ctx.scene.enter("mainMenuScene");
  });
}
