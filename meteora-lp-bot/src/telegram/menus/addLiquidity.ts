import { addLiquidityMessage } from "../components";
import { getBalance, getTokenBalance } from "../../services/solanaService";
import { getTokenData } from "../../utils/solana";
import { PublicKey } from "@solana/web3.js";
import { createPoolBalancePosition } from "../../services/dlmmService";

export async function displayAddLiquidityMenu(ctx) {
  const telegram_id = ctx.from.id;
  let response;
  let buttons = [];

  try {
    const strategyTypeSelected = ctx.session.addLiquidity.strategyType;
    const pairInfo = ctx.session.pairDetail.pairInfo;
    const wallet = new PublicKey(ctx.session.walletAddress);

    const [tokenX, tokenY] = pairInfo.name.split("-");
    ctx.session.addLiquidity.tokenSymbolX = tokenX;
    ctx.session.addLiquidity.tokenSymbolY = tokenY;

    let tokenPrice = await resolveTokenPrice(pairInfo.mintX, pairInfo.mintY);

    if (!tokenPrice) {
      tokenPrice = "0";
      await ctx.reply(
        "❌ An error occurred, token price could not be obtained."
      );
    }

    ctx.session.addLiquidity.tokenPrice = tokenPrice;

    // Check if balanceTokenX is already in the session, if it is not, we fetch it.
    if (ctx.session.addLiquidity.balanceTokenX === "0") {
      ctx.session.addLiquidity.balanceTokenX = await resolveTokenBalance(
        new PublicKey(pairInfo.mintX),
        wallet
      );
    }

    // Check if balanceTokenX is already in the session, if it is not, we fetch it.
    if (ctx.session.addLiquidity.balanceTokenY === "0") {
      ctx.session.addLiquidity.balanceTokenY = await resolveTokenBalance(
        new PublicKey(pairInfo.mintY),
        wallet
      );
    }

    const isAutoFill = ctx.session.addLiquidity.isAutoFill;

    response = addLiquidityMessage(
      pairInfo,
      tokenX,
      tokenY,
      ctx.session.addLiquidity.balanceTokenX,
      ctx.session.addLiquidity.balanceTokenY,
      ctx.session.addLiquidity.selectedBalanceX,
      ctx.session.addLiquidity.selectedBalanceY
    );

    buttons.push([
      { text: "Back", callback_data: "back_pair_liquidity" },
      { text: "↻ Refresh", callback_data: "refresh_pair_liquidity" },
    ]);

    buttons.push([
      {
        text: getCurrentStrategy("Spot", strategyTypeSelected),
        callback_data: "spot_action",
      },
      {
        text: getCurrentStrategy("Curve", strategyTypeSelected),
        callback_data: "curve_action",
      },
      {
        text: getCurrentStrategy("Bid Ask", strategyTypeSelected),
        callback_data: "bid_ask_action",
      },
    ]);
    buttons.push([
      {
        text: isAutoFill ? "🟢 Auto-Fill" : "🔴 Auto-Fill",
        callback_data: "auto_fill_action",
      },
    ]);
    buttons.push([
      {
        text: `Half ${tokenX}`,
        callback_data: "half_amount_action_X",
      },
      {
        text: `Max ${tokenX}`,
        callback_data: "max_amount_action_X",
      },
      {
        text: `X ${tokenX} ✏️`,
        callback_data: "custom_amount_action_X",
      },
    ]);
    buttons.push([
      {
        text: `Half ${tokenY}`,
        callback_data: "half_amount_action_Y",
      },
      {
        text: `Max ${tokenY}`,
        callback_data: "max_amount_action_Y",
      },
      {
        text: `X ${tokenY} ✏️`,
        callback_data: "custom_amount_action_Y",
      },
    ]);
    buttons.push([
      { text: "Add liquidity", callback_data: "add_liquidity_action" },
    ]);
  } catch (error) {
    console.error("🪐 ~ Error displaying add liquidity menu:", error);
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
      ctx.session.addLiquidity.messageId = ctx.callbackQuery.message.message_id;
    } else if (ctx.session.addLiquidity.messageId) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        ctx.session.addLiquidity.messageId,
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
      const sentMessage = await ctx.reply(response, {
        reply_markup: {
          inline_keyboard: buttons,
        },
        parse_mode: "HTML",
        disable_web_page_preview: true,
      });

      ctx.session.addLiquidity.messageId = sentMessage.message_id;
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
}

async function resolveTokenBalance(
  tokenMint: PublicKey,
  wallet: PublicKey
): Promise<string> {
  try {
    if (
      tokenMint.toBase58() === "So11111111111111111111111111111111111111112"
    ) {
      return await getBalance(wallet);
    } else {
      return await getTokenBalance(tokenMint, wallet);
    }
  } catch (error) {
    console.error(
      `🪐 ~ Error resolving balance for token ${tokenMint.toBase58()}:`,
      error
    );
    return "0"; // Devuelve "0" en caso de error
  }
}

async function resolveTokenPrice(
  mintX: string,
  mintY: string
): Promise<string> {
  //const mintSol = "So11111111111111111111111111111111111111112";
  //const mintAddress = mintX === mintSol ? mintY : mintX;
  const tokenResponse = await getTokenData([mintY], mintX);
  if (!tokenResponse || tokenResponse.length === 0) {
    return null;
  }
  console.log("🚀 ~ tokenResponse:", tokenResponse);
  const tokenData = tokenResponse.find((token) => token.mintAddress === mintY);
  const price = tokenData.price;
  return price;
}

function calculateAutoFillAmount(ctx) {
  const tokenPrice = parseFloat(ctx.session.addLiquidity.tokenPrice);
}

function getCurrentStrategy(
  strategyType: string,
  strategyTypeSelected: string
) {
  if (!strategyTypeSelected) {
    return strategyType;
  }

  return strategyTypeSelected === strategyType
    ? `🔥 ${strategyType}`
    : strategyType;
}

export async function setupAddLiquidityActions(bot) {
  // Strategy actions
  bot.action("spot_action", async (ctx) => {
    ctx.session.addLiquidity.strategyType = "Spot";
    await displayAddLiquidityMenu(ctx);
  });
  bot.action("curve_action", async (ctx) => {
    ctx.session.addLiquidity.strategyType = "Curve";
    await displayAddLiquidityMenu(ctx);
  });
  bot.action("bid_ask_action", async (ctx) => {
    ctx.session.addLiquidity.strategyType = "Bid Ask";
    await displayAddLiquidityMenu(ctx);
  });
  // END Strategy actions

  // TokenX amounts
  bot.action("half_amount_action_X", async (ctx) => {
    try {
      const balanceTokenX = parseFloat(ctx.session.addLiquidity.balanceTokenX);

      if (isNaN(balanceTokenX) || balanceTokenX <= 0) {
        return await ctx.reply(
          "⚠️ Cannot select half of the balance because the balance is zero or invalid."
        );
      }

      const halfAmount = balanceTokenX / 2;

      if (halfAmount <= 0) {
        return await ctx.reply("⚠️ Cannot select half of the balance.");
      }

      ctx.session.addLiquidity.selectedBalanceX = halfAmount.toFixed(3);

      if (ctx.session.addLiquidity.isAutoFill) {
        const tokenPrice = parseFloat(ctx.session.addLiquidity.tokenPrice);

        if (!isNaN(tokenPrice) && tokenPrice > 0) {
          const halfAmountY = halfAmount / tokenPrice;
          ctx.session.addLiquidity.selectedBalanceY = halfAmountY.toFixed(3);
        } else {
          return await ctx.reply(
            "⚠️ Cannot calculate auto-fill as token price is invalid."
          );
        }
      }

      await displayAddLiquidityMenu(ctx);
    } catch (error) {
      console.error("Failed to calculate half amount X:", error);
      await ctx.reply(
        "❌ An error occurred while calculating the half amount."
      );
    }
  });
  bot.action("max_amount_action_X", async (ctx) => {
    try {
      const balanceTokenX = parseFloat(ctx.session.addLiquidity.balanceTokenX);

      if (isNaN(balanceTokenX) || balanceTokenX <= 0) {
        return await ctx.reply(
          "⚠️ Cannot select max amount because the balance is zero or invalid."
        );
      }

      const maxAmount = balanceTokenX - 0.05;

      if (maxAmount <= 0) {
        return await ctx.reply(
          "⚠️ Max amount cannot be less than or equal to zero."
        );
      }

      ctx.session.addLiquidity.selectedBalanceX = maxAmount.toFixed(3);

      if (ctx.session.addLiquidity.isAutoFill) {
        const tokenPrice = parseFloat(ctx.session.addLiquidity.tokenPrice);

        if (!isNaN(tokenPrice) && tokenPrice > 0) {
          const maxAmountY = maxAmount / tokenPrice;
          ctx.session.addLiquidity.selectedBalanceY = maxAmountY.toFixed(3);
        } else {
          return await ctx.reply(
            "⚠️ Cannot calculate auto-fill as token price is invalid."
          );
        }
      }

      await displayAddLiquidityMenu(ctx);
    } catch (error) {
      console.error("Failed to calculate max amount X:", error);
      await ctx.reply("❌ An error occurred while calculating the max amount.");
    }
  });
  bot.action("custom_amount_action_X", async (ctx) => {
    try {
      const balanceTokenX = ctx.session.addLiquidity.balanceTokenX;
      const tokenSymbolX = ctx.session.addLiquidity.tokenSymbolX;
      const requestMessage = await ctx.reply(
        `Enter the custom amount for ${tokenSymbolX}:\n\n <b>Balance:</b> <code>${balanceTokenX}</code> ${tokenSymbolX}`,
        {
          parse_mode: "HTML",
        }
      );
      console.log("custom_amount_action_X", requestMessage.message_id);
      ctx.session.addLiquidity.requestMessageId = requestMessage.message_id;
      ctx.session.awaitingInput = "custom_amount_action_X";
      //await waitForMessage();
    } catch (error) {
      console.error("Failed to send request message:", error);
    }
  });
  // END TokenX amounts

  // TokenY amounts
  bot.action("half_amount_action_Y", async (ctx) => {
    try {
      const balanceTokenY = parseFloat(ctx.session.addLiquidity.balanceTokenY);

      // Validar que el balance es un número válido y mayor que cero
      if (isNaN(balanceTokenY) || balanceTokenY <= 0) {
        return await ctx.reply(
          "⚠️ Cannot select half of the balance because the balance is zero or invalid."
        );
      }

      const halfAmount = balanceTokenY / 2;

      if (halfAmount <= 0) {
        return await ctx.reply(
          "⚠️ Half amount cannot be less than or equal to zero."
        );
      }

      ctx.session.addLiquidity.selectedBalanceY = halfAmount.toFixed(3);

      // Validación y cálculo para Auto-Fill
      if (ctx.session.addLiquidity.isAutoFill) {
        const tokenPrice = parseFloat(ctx.session.addLiquidity.tokenPrice);

        if (!isNaN(tokenPrice) && tokenPrice > 0) {
          const halfAmountX = tokenPrice * halfAmount;
          ctx.session.addLiquidity.selectedBalanceX = halfAmountX.toFixed(3);
        } else {
          return await ctx.reply(
            "⚠️ Cannot calculate auto-fill as token price is invalid."
          );
        }
      }

      await displayAddLiquidityMenu(ctx);
    } catch (error) {
      console.error("Failed to calculate half amount Y:", error);
      await ctx.reply(
        "❌ An error occurred while calculating the half amount for Y."
      );
    }
  });
  bot.action("max_amount_action_Y", async (ctx) => {
    try {
      const balanceTokenY = parseFloat(ctx.session.addLiquidity.balanceTokenY);

      // Validate that the balance is a valid number greater than zero
      if (isNaN(balanceTokenY) || balanceTokenY <= 0) {
        return await ctx.reply(
          "⚠️ Cannot select max amount because the balance is zero or invalid."
        );
      }

      const maxAmount = balanceTokenY - 0.05;

      // Verify that maxAmount is greater than zero after subtracting the minimum quantity
      if (maxAmount <= 0) {
        return await ctx.reply(
          "⚠️ Max amount cannot be less than or equal to zero."
        );
      }

      ctx.session.addLiquidity.selectedBalanceY = maxAmount.toFixed(3);

      // Validation and calculation for Auto-Fill
      if (ctx.session.addLiquidity.isAutoFill) {
        const tokenPrice = parseFloat(ctx.session.addLiquidity.tokenPrice);

        if (!isNaN(tokenPrice) && tokenPrice > 0) {
          const maxAmountX = tokenPrice * maxAmount;
          ctx.session.addLiquidity.selectedBalanceX = maxAmountX.toFixed(3);
        } else {
          return await ctx.reply(
            "⚠️ Cannot calculate auto-fill as token price is invalid."
          );
        }
      }

      await displayAddLiquidityMenu(ctx);
    } catch (error) {
      console.error("Failed to calculate max amount Y:", error);
      await ctx.reply(
        "❌ An error occurred while calculating the max amount for Y."
      );
    }
  });
  bot.action("custom_amount_action_Y", async (ctx) => {
    try {
      const balanceTokenY = ctx.session.addLiquidity.balanceTokenY;
      const tokenSymbolY = ctx.session.addLiquidity.tokenSymbolY;
      const requestMessage = await ctx.reply(
        `Enter the custom amount for ${tokenSymbolY}:\n\n <b>Balance:</b> <code>${balanceTokenY}</code> ${tokenSymbolY}`,
        {
          parse_mode: "HTML",
        }
      );
      console.log("custom_amount_action_Y action");
      ctx.session.addLiquidity.requestMessageId = requestMessage.message_id;
      ctx.session.awaitingInput = "custom_amount_action_Y";
      console.log(
        "custom_amount_action_Y: ",
        ctx.session.addLiquidity.requestMessageId
      );
      //await waitForMessage();
    } catch (error) {
      console.error("Failed to send request message:", error);
    }
  });
  // END TokenX amounts

  bot.action("add_liquidity_action", async (ctx) => {
    try {
      const balanceTokenX = parseFloat(ctx.session.addLiquidity.balanceTokenX);
      const balanceTokenY = parseFloat(ctx.session.addLiquidity.balanceTokenY);
      const selectedBalanceX = parseFloat(
        ctx.session.addLiquidity.selectedBalanceX
      );
      const selectedBalanceY = parseFloat(
        ctx.session.addLiquidity.selectedBalanceY
      );
      const tokenSymbolX = ctx.session.addLiquidity.tokenSymbolX;
      const tokenSymbolY = ctx.session.addLiquidity.tokenSymbolY;
      const pairInfo = ctx.session.pairDetail.pairInfo;

      if (selectedBalanceX > balanceTokenX) {
        return ctx.reply(
          `⚠️ Selected amount cannot exceed the balance: ${balanceTokenX} max`
        );
      }

      if (selectedBalanceY > balanceTokenY) {
        return ctx.reply(
          `⚠️ Selected amount cannot exceed the balance: ${balanceTokenY} max`
        );
      }

      if (selectedBalanceX === 0 && selectedBalanceY === 0) {
        return ctx.reply("⚠️ Please select an amount, both tokens cannot be 0");
      }

      if ((selectedBalanceX.toString().split(".")[1]?.length || 0) > 9) {
        return ctx.reply(`⚠️ Too many decimal places for ${tokenSymbolX}`);
      }

      if ((selectedBalanceY.toString().split(".")[1]?.length || 0) > 9) {
        return ctx.reply(`⚠️ Too many decimal places for ${tokenSymbolY}`);
      }
      const user = new PublicKey(ctx.session.walletAddress);
      const encodedTx = await createPoolBalancePosition(
        pairInfo.address,
        selectedBalanceX,
        selectedBalanceY,
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
      console.error("Failed to add liquidity:", error);
    }
  });

  bot.action("auto_fill_action", async (ctx) => {
    ctx.session.addLiquidity.isAutoFill = !ctx.session.addLiquidity.isAutoFill;
    await displayAddLiquidityMenu(ctx);
  });
  bot.action("refresh_pair_liquidity", async (ctx) => {
    const pairInfo = ctx.session.pairDetail.pairInfo;
    const wallet = new PublicKey(ctx.session.walletAddress);

    ctx.session.addLiquidity.tokenPrice = await resolveTokenPrice(
      pairInfo.mintX,
      pairInfo.mintY
    );

    ctx.session.addLiquidity.balanceTokenX = await resolveTokenBalance(
      new PublicKey(pairInfo.mintX),
      wallet
    );

    ctx.session.addLiquidity.balanceTokenY = await resolveTokenBalance(
      new PublicKey(pairInfo.mintY),
      wallet
    );

    await displayAddLiquidityMenu(ctx);
  });

  bot.action("back_pair_liquidity", (ctx) => {
    ctx.scene.enter("pairDetailScene");
  });
}

export async function setCustomAmountInput(ctx, awaitingInput) {
  if (
    awaitingInput === "custom_amount_action_X" ||
    awaitingInput === "custom_amount_action_Y"
  ) {
    console.log("ctx.message.textX", ctx.message.text);
    const inputAmount = parseFloat(ctx.message.text);

    let userMessageId = ctx.message.message_id;

    if (isNaN(inputAmount)) {
      if (userMessageId) {
        await ctx.deleteMessage(userMessageId);
        userMessageId = null;
      }
      if (ctx.session.addLiquidity.requestMessageId) {
        await ctx.deleteMessage(
          Number(ctx.session.addLiquidity.requestMessageId)
        );
        ctx.session.addLiquidity.requestMessageId = null;
      }

      return ctx.reply("‼️ Please enter valid numeric values.");
    }
    if (inputAmount < 0) {
      if (userMessageId) {
        await ctx.deleteMessage(userMessageId);
        userMessageId = null;
      }
      if (ctx.session.addLiquidity.requestMessageId) {
        await ctx.deleteMessage(
          Number(ctx.session.addLiquidity.requestMessageId)
        );
        ctx.session.addLiquidity.requestMessageId = null;
      }

      return ctx.reply("‼️ Negative values are not allowed");
    }

    if (awaitingInput === "custom_amount_action_X") {
      if (inputAmount > parseFloat(ctx.session.addLiquidity.balanceTokenX)) {
        if (userMessageId) {
          await ctx.deleteMessage(userMessageId);
          userMessageId = null;
        }
        if (ctx.session.addLiquidity.requestMessageId) {
          await ctx.deleteMessage(
            Number(ctx.session.addLiquidity.requestMessageId)
          );
          ctx.session.addLiquidity.requestMessageId = null;
        }

        return ctx.reply(
          `⚠️ Not enough balance for ${ctx.session.addLiquidity.tokenSymbolX}`
        );
      }
      ctx.session.addLiquidity.selectedBalanceX = ctx.message.text;

      console.log(
        "🚀 ~ bot.on ~ selectedBalanceX:",
        ctx.session.addLiquidity.selectedBalanceX
      );

      if (ctx.session.addLiquidity.isAutoFill) {
        const tokenPrice = parseFloat(ctx.session.addLiquidity.tokenPrice);

        const halfAmountY = inputAmount / tokenPrice;
        ctx.session.addLiquidity.selectedBalanceY = halfAmountY.toFixed(3);
      }
    }

    if (awaitingInput === "custom_amount_action_Y") {
      if (inputAmount > parseFloat(ctx.session.addLiquidity.balanceTokenY)) {
        if (userMessageId) {
          await ctx.deleteMessage(userMessageId);
          userMessageId = null;
        }
        if (ctx.session.addLiquidity.requestMessageId) {
          await ctx.deleteMessage(
            Number(ctx.session.addLiquidity.requestMessageId)
          );
          ctx.session.addLiquidity.requestMessageId = null;
        }

        return ctx.reply(
          `⚠️ Not enough balance for ${ctx.session.addLiquidity.tokenSymbolY}`
        );
      }
      ctx.session.addLiquidity.selectedBalanceY = ctx.message.text;
      console.log(
        "🚀 ~ bot.on ~ selectedBalanceY:",
        ctx.session.addLiquidity.selectedBalanceY
      );

      if (ctx.session.addLiquidity.isAutoFill) {
        const tokenPrice = parseFloat(ctx.session.addLiquidity.tokenPrice);

        const halfAmountX = tokenPrice * inputAmount;
        console.log("🪐 ~ bot.on ~ halfAmountX:", halfAmountX);
        ctx.session.addLiquidity.selectedBalanceX = halfAmountX.toFixed(3);
      }
    }
    if (userMessageId) {
      await ctx.deleteMessage(userMessageId);
    }

    if (ctx.session.addLiquidity.requestMessageId) {
      await ctx.deleteMessage(
        Number(ctx.session.addLiquidity.requestMessageId)
      );
    }

    await displayAddLiquidityMenu(ctx);
  }
}
