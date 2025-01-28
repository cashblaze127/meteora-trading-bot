import { getAllUserPositions } from "../../services/dlmmService";
import { getBalance } from "../../services/solanaService";
import { poolsInfoMessage } from "../components";
import { PublicKey } from "@solana/web3.js";

export const displayMainMenu = async (ctx) => {
  const telegram_id = ctx.from.id;
  const wallet = new PublicKey(ctx.session.walletAddress);
  const formattedWalletAddress = `${wallet.toBase58().slice(0, 4)}...${wallet
    .toBase58()
    .slice(-4)}`;

  // Inicializamos los valores de balance y posiciones
  ctx.session.mainMenu.balance = "";
  ctx.session.mainMenu.balance = await getBalance(wallet);
  ctx.session.mainMenu.positions = await getAllUserPositions(wallet, 3);

  let response = `☄️ <b>ＭＥＴＥＯＲＡ  ＬＰ  ＡＲＭＹ</b> 🪐\n\n<code>${wallet.toBase58()}</code>\n\n`;
  response += `<b>Balance</b>: <code>${ctx.session.mainMenu.balance}</code> SOL\n\n`;
  response += `<b>Positions</b> (${ctx.session.mainMenu.positions.length} / 3)\n`;

  response += poolsInfoMessage(ctx.session.mainMenu.positions);

  const buttons = [];

  buttons.push([
    { text: "Create pool", callback_data: "create_pool" },
    { text: "Positions", callback_data: "positions" },
    { text: "Swap", callback_data: "swap" },
  ]);
  buttons.push([{ text: "Search pools", callback_data: "search_pools" }]);
  buttons.push([
    { text: "Info", callback_data: "info" },
    { text: "Settings", callback_data: "settings" },
  ]);
  buttons.push([{ text: "↻ Refresh", callback_data: "refresh_main" }]);

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
      const sentMessage = await ctx.reply(response, {
        reply_markup: {
          inline_keyboard: buttons,
          resize_keyboard: true,
          one_time_keyboard: false,
        },
        parse_mode: "HTML",
        disable_web_page_preview: true,
      });
      ctx.session.mainMenu.messageId = sentMessage.message_id;
    }

    // Después de enviar el mensaje inline, envía el botón `web_app` en el teclado regular
    const webAppUrl = "https://meteora-react-dynamic-wallet.vercel.app/";
    await ctx.reply("🔌 Wallet updated", {
      reply_markup: {
        keyboard: [
          [
            {
              text: `☄️ Wallet connected ${formattedWalletAddress}`,
              web_app: { url: webAppUrl },
            },
          ],
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    });
  } catch (error) {
    console.error("Failed to edit or send message:", error);
  }
};

export async function setupMainActions(bot) {
  bot.action("search_pools", async (ctx) => {
    ctx.reply("🔍 Search by token name, symbol, mint:");
    ctx.session.awaitingInput = "search_pools";
  });

  bot.action("positions", (ctx) => {
    ctx.scene.enter("positionListScene");
  });
  bot.action("refresh_main", async (ctx) => {
    displayMainMenu(ctx);
  });
}

export async function searchPoolInput(ctx, awaitingInput) {
  if (awaitingInput === "search_pools") {
    ctx.session.pairList.userInput = ctx.message.text;
    console.log(`User input: ${ctx.session.pairList.userInput}`);

    await ctx.scene.enter("pairScene");
  }
}
