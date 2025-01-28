import { searchPairByGroup } from "../../utils/solana";
import { pairListDetailMessage } from "../components";

export const displayPairListDetailMenu = async (ctx) => {
  const telegram_id = ctx.from.id;
  console.log("🚀 ~ text ~ text");
  const userInput = ctx.session.pairListDetail.userInput;
  console.log("🚀 ~ displayPairListMenu ~ userInput:", userInput);
  const pairNameSelected = ctx.session.pairListDetail.pairNameSelected;
  const page = ctx.session.pairListDetail.pageListDetail || 0;
  const itemsPerPage = 5;

  // Service to obtain all pairs
  const pairResponse = await searchPairByGroup(pairNameSelected, 0, 1);

  let pairs;
  let end;
  let response;

  if (
    !pairResponse.groups ||
    pairResponse.groups.length === 0 ||
    !pairResponse.groups[0].pairs ||
    pairResponse.groups[0].pairs.length === 0
  ) {
    response = "No pairs available 🥲";
  } else {
    pairs = pairResponse.groups[0].pairs;
    console.log("🚀 ~ displayPairListDetailMenu ~ total pairs:", pairs.length);

    // We implement pagination by dividing the array into pages of 5 elements.
    const start = page * itemsPerPage;
    end = start + itemsPerPage;
    console.log("🚀 ~ displayPairListDetailMenu ~ start:", start);
    console.log("🚀 ~ displayPairListDetailMenu ~ end:", end);

    // If `start` is greater than or equal to the number of peers, we reset the page
    if (start >= pairs.length) {
      ctx.session.pairListDetail.pageListDetail = Math.max(
        0,
        Math.floor(pairs.length / itemsPerPage) - 1
      );
      await displayPairListDetailMenu(ctx);
      return;
    }

    const pairsToDisplay = pairs.slice(start, end);
    console.log(
      "🚀 ~ displayPairListDetailMenu ~ pairsToDisplay:",
      pairsToDisplay
    );

    if (pairsToDisplay.length === 0) {
      response = "No more pairs available.";
    } else {
      response = pairListDetailMessage(pairsToDisplay);
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

export async function setupPairListDetailActions(bot) {
  bot.action("previous_list_detail", async (ctx) => {
    ctx.session.pairListDetail.pageListDetail =
      ctx.session.pairListDetail.pageListDetail > 0
        ? ctx.session.pairListDetail.pageListDetail - 1
        : 0;
    await displayPairListDetailMenu(ctx);
  });

  bot.action("next_list_detail", async (ctx) => {
    if (typeof ctx.session.pairListDetail.pageListDetail !== "number") {
      ctx.session.pairListDetail.pageListDetail = 0;
    }

    ctx.session.pairListDetail.pageListDetail =
      ctx.session.pairListDetail.pageListDetail + 1;
    await displayPairListDetailMenu(ctx);
  });

  bot.action("back_pair_list_detail", async (ctx) => {
    ctx.scene.enter("pairScene");
  });
}
