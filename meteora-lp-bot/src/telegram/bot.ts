import { Markup, Scenes, session, Telegraf } from "telegraf";
import { Position, PairInfo } from "../models/Position";
import {
  displayMainMenu,
  setupMainActions,
  searchPoolInput,
} from "./menus/main";

import {
  displayPositionDetailMenu,
  setupPositionDetailActions,
} from "./menus/positionDetail";
import {
  displayPositionListMenu,
  setupPositionListActions,
} from "./menus/positionList";
import { displayPairListMenu, setupPairListActions } from "./menus/pairList";
import {
  displayPairListDetailMenu,
  setupPairListDetailActions,
} from "./menus/pairListDetail";
import {
  displayPairDetailMenu,
  setupPairDetailActions,
} from "./menus/pairDetail";
import {
  displayAddLiquidityMenu,
  setupAddLiquidityActions,
  setCustomAmountInput,
} from "./menus/addLiquidity";

import { displayUserOnboardingMenu } from "./menus/userOnboarding";

interface MySession extends Scenes.SceneSession {
  mainMenu?: {
    balance?: string;
    positions?: Position[];
    userInput?: string;
  };
  positionList?: {
    balance?: string;
    positions?: Position[];
  };
  positionDetail?: {
    positionId?: string;
    positionWithPairInfo?: Position;
    positions?: Position[];
  };
  pairList?: {
    userInput?: string;
    page?: number;
  };
  pairListDetail?: {
    userInput?: string;
    pairNameSelected?: string;
    pageListDetail?: number;
  };
  pairDetail?: {
    positionId?: string;
    pairInfo?: PairInfo;
  };
  addLiquidity?: {
    strategyType?: string;
    isAutoFill?: boolean;
    tokenPrice?: string;
    tokenSymbolX?: string;
    tokenSymbolY?: string;
    balanceTokenX?: string;
    balanceTokenY?: string;
    selectedBalanceX?: string;
    selectedBalanceY?: string;
    messageId?: string;
    requestMessageId?: string;
  };
  awaitingInput?: string;
  walletAddress?: string;
}

interface MyContext extends Scenes.SceneContext {
  session: MySession;
}

let bot: Telegraf<MyContext> | undefined = undefined;

export const userOnboarding = new Scenes.BaseScene<MyContext>("userOnboarding");
export const mainMenuScene = new Scenes.BaseScene<MyContext>("mainMenuScene");
export const positionDetailScene = new Scenes.BaseScene<MyContext>(
  "positionDetailScene"
);
export const positionListScene = new Scenes.BaseScene<MyContext>(
  "positionListScene"
);
export const pairListScene = new Scenes.BaseScene<MyContext>("pairScene");
export const pairListDetailScene = new Scenes.BaseScene<MyContext>(
  "pairListDetailScene"
);
export const pairDetailScene = new Scenes.BaseScene<MyContext>(
  "pairDetailScene"
);
export const addLiquidityScene = new Scenes.BaseScene<MyContext>(
  "addLiquidityScene"
);

export async function initializeBot(): Promise<Telegraf<MyContext>> {
  if (bot) {
    return bot;
  }

  bot = new Telegraf<MyContext>(process.env.BOT_TOKEN);

  const stage = new Scenes.Stage<MyContext>(
    [
      userOnboarding,
      mainMenuScene,
      positionDetailScene,
      positionListScene,
      pairListScene,
      pairListDetailScene,
      pairDetailScene,
      addLiquidityScene,
    ],
    {
      ttl: 10,
    }
  );

  bot.use(session());
  bot.use(stage.middleware());

  // Middleware to initialize session data
  bot.use(async (ctx, next) => {
    await initSessionData(ctx);
    return next();
  });

  bot.on("web_app_data", async (ctx) => {
    try {
      const message = ctx.message.web_app_data.data;
      console.log(message);

      if (message.startsWith("auth_")) {
        const walletId = message.replace("auth_", "");
        console.log("✅ Wallet connected:", walletId);

        ctx.session.walletAddress = walletId;
        ctx.scene.enter("mainMenuScene");
      }

      if (message === "logout") {
        ctx.session.walletAddress = undefined;
        ctx.reply("✅ Logout");
      }

      // Check if the message contains a Solscan URL
      const solscanUrlRegex = /https:\/\/solscan\.io\/tx\/[a-zA-Z0-9]+/;
      const match = message.match(solscanUrlRegex);
      if (match) {
        const solscanUrl = match[0];
        //`🪐 <b>Successfully</b> closed position with claimed fees🥳\n${solscanUrl}`
        //`🪐 <b>Successfully</b> added liquidity to pool 🥳\n${solscanUrl}`
        await ctx.reply(
          `🪐 <b>Successfully</b> added liquidity to pool 🥳\n${solscanUrl}`,
          {
            parse_mode: "HTML",
          }
        );
      }
    } catch (error) {
      console.error("Error handling the Web App data:", error);
    }
  });

  bot.start(async (ctx) => {
    const startParam = ctx.message.text.split(" ")[1];

    if (ctx.session.walletAddress === undefined) {
      ctx.scene.enter("userOnboarding");
      return;
    }

    if (startParam && startParam.startsWith("position_")) {
      ctx.session.positionDetail.positionId = startParam.split("_")[1];
      ctx.scene.enter("positionDetailScene");
    }
    if (startParam && startParam.startsWith("pair_")) {
      ctx.session.pairDetail.positionId = startParam.split("_")[1];
      ctx.scene.enter("pairDetailScene");
    }
    if (startParam && startParam.startsWith("pairListDetail_")) {
      const pairName = startParam.split("_")[1];
      ctx.session.pairListDetail.pairNameSelected = pairName;
      ctx.scene.enter("pairListDetailScene");
    }
    if (!startParam) {
      ctx.scene.enter("mainMenuScene");
    }
  });

  await setupMainActions(bot);
  await setupPositionDetailActions(bot);
  await setupPositionListActions(bot);
  await setupPairListDetailActions(bot);
  await setupPairListActions(bot);
  await setupPairDetailActions(bot);
  await setupAddLiquidityActions(bot);
  await handleInputMessages(bot);

  await console.log(`
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⣿⡟⡿⢯⡻⡝⢯⡝⡾⣽⣻⣟⡿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢻⠳⣏⠧⠹⡘⢣⠑⠎⠱⣈⠳⢡⠳⢭⣛⠷⣟⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⣝⣎⢣⠡⠌⣢⠧⠒⠃⠁⠈⠉⠉⠑⠓⠚⠦⣍⡞⡽⣞⡿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⣝⠮⡜⣢⠕⠊⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠐⠄⡙⠲⣝⡺⡽⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⣿⣿⡹⢎⣳⠞⡡⠊⠀⠀⠀⣀⣤⣤⣶⣶⣤⣤⣀⡈⠂⠄⠙⠱⡌⠳⣹⢎⡿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⣽⣟⣳⡝⡼⢁⠎⠀⡀⢁⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⡄⠰⣄⠈⠓⢌⠛⢽⣣⡟⢿⠿⣿⣿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⡿⣽⠳⡼⢁⡞⠀⡜⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡆⢸⢵⠀⠀⠁⠂⠤⣉⠉⠓⠒⠚⠦⠥⡈⠉⣙⢛⡿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⡾⣽⣏⢳⢃⣞⠃⡼⢀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡄⠀⠀⠀⠀⠀⠀⠀⠀⠁⢀⣀⠤⠐⢋⡰⣌⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⣮⢳⣿⠶⠁⠖⠃⠀⠁⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠿⠿⠟⠛⠛⠀⠀⠀⠀⢀⡤⠤⠐⠒⣉⠡⣄⠶⣭⣿⣽⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⡿⠿⢉⡢⠝⠁⠀⠃⠀⠀⠀⠀⠀⠿⠃⠿⠿⠿⠛⠋⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⠀⣀⢤⣰⣲⣽⣾⡟⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣟⡿⡚⠏⠁⠀⠐⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠂⣠⠀⣯⣗⣮⢿⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⢯⡝⠠⠁⠀⠀⠠⠤⠀⠀⠀⠀⡀⠢⣄⣀⡀⠐⠤⡀⠀⠀⠀⢤⣄⣀⠤⣄⣤⢤⣖⡾⠋⢁⡼⠁⣸⡿⣞⣽⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣷⣾⣵⣦⣶⣖⣳⣶⣝⣶⣯⣷⣽⣷⣾⣶⣽⣯⣶⠄⠈⠒⣤⣀⠉⠙⠛⠛⠋⠋⢁⣠⠔⠁⠀⢰⣿⣽⣯⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣦⡄⡀⡉⠛⠓⠶⠶⠒⠛⠋⠀⠀⢀⣼⣻⢷⣾⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣾⣧⡵⣌⣒⢂⠀⣀⣀⣠⣤⣶⣿⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣿⣾⣷⣯⣿⣧⣿⣷⣿⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿`);
  return bot;
}

async function handleInputMessages(bot) {
  bot.hears(/.*/, async (ctx) => {
    const awaitingInput = ctx.session.awaitingInput;

    await searchPoolInput(ctx, awaitingInput);
    await setCustomAmountInput(ctx, awaitingInput);
  });
}

async function initSessionData(ctx) {
  ctx.session.mainMenu = ctx.session.mainMenu || {
    balance: "0",
    positions: [],
    userInput: "",
  };
  ctx.session.positionDetail = ctx.session.positionDetail || {
    positionId: "",
    positionWithPairInfo: null,
    positions: [],
  };
  ctx.session.positionList = ctx.session.positionList || {
    balance: "0",
    positions: [],
  };
  ctx.session.pairList = ctx.session.pairList || {
    userInput: "",
    page: 0,
  };
  ctx.session.pairListDetail = ctx.session.pairListDetail || {
    userInput: "",
    pairNameSelected: "",
    pageListDetail: 0,
  };
  ctx.session.pairDetail = ctx.session.pairDetail || {
    positionId: "",
    pairInfo: null,
  };
  ctx.session.addLiquidity = ctx.session.addLiquidity || {
    strategyType: "Spot",
    isAutoFill: false,
    tokenPrice: "0",
    tokenSymbolX: "",
    tokenSymbolY: "",
    balanceTokenX: "0",
    balanceTokenY: "0",
    selectedBalanceX: "0",
    selectedBalanceY: "0",
    messageId: "",
    requestMessageId: "",
  };
  ctx.session.awaitingInput = ctx.session.awaitingInput || "";
  ctx.session.walletAddress = ctx.session.walletAddress || undefined;
}

export async function startBot() {
  const initializedBot = await initializeBot();

  // Scene configuration only after the bot is initialized
  userOnboarding.enter(async (ctx) => {
    await displayUserOnboardingMenu(ctx);
  });
  mainMenuScene.enter(async (ctx) => {
    await displayMainMenu(ctx);
  });

  positionDetailScene.enter(async (ctx) => {
    await displayPositionDetailMenu(ctx);
  });

  positionListScene.enter(async (ctx) => {
    await displayPositionListMenu(ctx);
  });

  pairListScene.enter(async (ctx) => {
    await displayPairListMenu(ctx);
  });

  pairListDetailScene.enter(async (ctx) => {
    await displayPairListDetailMenu(ctx);
  });

  pairDetailScene.enter(async (ctx) => {
    await displayPairDetailMenu(ctx);
  });

  addLiquidityScene.enter(async (ctx) => {
    await displayAddLiquidityMenu(ctx);
  });

  await initializedBot.launch(); // Launch bot on safe mode

  // Graceful shutdown handling
  process.once("SIGINT", () => {
    console.log("SIGINT received. Stopping bot...");
    initializedBot.stop("SIGINT");
  });

  process.once("SIGTERM", () => {
    console.log("SIGTERM received. Stopping bot...");
    initializedBot.stop("SIGTERM");
  });
}
