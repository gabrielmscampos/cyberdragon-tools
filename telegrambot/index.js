import TelegramBot from 'node-telegram-bot-api';
import stringTable from 'string-table';

import {
  USDCollections,
  Symbols
} from '../api/db/symbols.js'
import {
  checkAccount,
  checkAccountWithChatID,
  insertAccount,
  deleteAccount,
  updateAccountTokens,
  updateAccountChat,
  getTokenPrice
} from '../api/db/mongo.js'
import {
  web3,
  roleToName,
  fetchHeroInfo,
  fetchHeroWork,
  fetchHeroIncome
} from '../api/blockchain/chain.js'
import {
  getPrimaryStats,
  computeSalaryPerBlock
} from '../api/bnx/salary.js'

// Create a bot that uses 'polling' to fetch new updates
const tokenTelegramBot = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(tokenTelegramBot, {polling: true});
bot.on("polling_error", console.log);

// Get token price ATM
bot.onText(/\/t (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const tokenName = match[1];

  // Translate to token collection and get current timestamp
  const tokenSymbol = Symbols[tokenName.toUpperCase()];
  const tokenCollection = USDCollections[tokenSymbol.toUpperCase()];
  const currentTimestamp = new Date();
  currentTimestamp.setUTCHours(0,0,0,0);

  // If token collection is not set in api, it is not available for querying
  if (tokenCollection === undefined) {
    bot.sendMessage(chatId, 'Token ' + tokenSymbol + ' not available!');
    return;
  }

  try {
    const result = await getTokenPrice(tokenCollection, tokenSymbol, currentTimestamp);
    const currentOHLC = result.ohlc[result.ohlc.length - 1];
    const price = currentOHLC.close;
    const time = currentOHLC.time;
    
    let responseMsg = '';
    responseMsg += `Timestamp: ${time.toISOString()}\n`;
    responseMsg += `Price: $${price}`;
    bot.sendMessage(chatId, responseMsg);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, 'Internal server error.');
  };
  
});

// Get all tokens price ATM
bot.onText(/\/p/, async (msg) => {
  const chatId = msg.chat.id;

  // Get current timestamp
  const currentTimestamp = new Date();
  currentTimestamp.setUTCHours(0,0,0,0);

  try {
    let responseMsg = '';

    for (let tokenName of Object.keys(USDCollections)) {
      const tokenCollection = USDCollections[tokenName];
      const tokenSymbol = Symbols[tokenName];
      const result = await getTokenPrice(tokenCollection, tokenSymbol, currentTimestamp);
      const currentOHLC = result.ohlc[result.ohlc.length - 1];
      const price = currentOHLC.close;
      const time = currentOHLC.time;
      responseMsg += `Pair: ${tokenCollection}\n`;
      responseMsg += `Timestamp: ${time.toISOString()}\n`;
      responseMsg += `Price: $${price}\n\n`;
    }
    
    bot.sendMessage(chatId, responseMsg);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, 'Internal server error.');
  };
  
});

// Simulate one-character rewards at BinaryX
bot.onText(/\/c (.+) (.+) (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const primaryStat = match[1];
  const secondaryStat = match[2];
  const level = match[3];

  // Translate to token collection and get current timestamp
  const nBlocksPerDay = 432000/15;
  const tokenSymbol = Symbols['GOLD'];
  const tokenCollection = USDCollections['GOLD'];
  const currentTimestamp = new Date();
  currentTimestamp.setUTCHours(0,0,0,0);

  try {
    const result = await getTokenPrice(tokenCollection, tokenSymbol, currentTimestamp);
    const currentOHLC = result.ohlc[result.ohlc.length - 1];
    const price = currentOHLC.close;
    const time = currentOHLC.time;
    const salaryPerBlock = computeSalaryPerBlock([primaryStat, secondaryStat], level);
    const salaryPerDay = salaryPerBlock*nBlocksPerDay;
    const salaryPer15Days = salaryPerBlock*nBlocksPerDay*15;
    const salaryPerMonth = salaryPerBlock*nBlocksPerDay*30;
    const dollarsPerDay = price*salaryPerDay;
    const dollarsPer15Days = price*salaryPer15Days;
    const dollarsPerMonth = price*salaryPerMonth;
    
    let responseMsg = '';
    responseMsg += `Computation at 100% mining ratio\n\n`
    responseMsg += `Level: ${level}\n`
    responseMsg += `Primary Status: ${primaryStat}\n`
    responseMsg += `Secondary Status: ${secondaryStat}\n\n`
    responseMsg += `GOLD/block: ${salaryPerBlock.toFixed(3)}\n`
    responseMsg += `GOLD/day: ${salaryPerDay.toFixed(2)}\n`
    responseMsg += `GOLD/15days: ${salaryPer15Days.toFixed(2)}\n`
    responseMsg += `GOLD/month: ${salaryPerMonth.toFixed(2)}\n\n`
    responseMsg += `USD/day: ${dollarsPerDay.toFixed(2)}\n`
    responseMsg += `USD/15days: ${dollarsPer15Days.toFixed(2)}\n`
    responseMsg += `USD/month: ${dollarsPerMonth.toFixed(2)}\n\n`
    responseMsg += `Pair: ${tokenCollection}\n`;
    responseMsg += `Timestamp: ${time.toISOString()}\n`;
    responseMsg += `Price: $${price}`;
    bot.sendMessage(chatId, responseMsg);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, 'Internal server error.');
  };

});

// Simulate multi-character rewards at BinaryX
bot.onText(/\/cl (.+) (.+) (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const primaryStat = match[1].split(',');
  const secondaryStat = match[2].split(',');
  const level = match[3].split(',');

  // Translate to token collection and get current timestamp
  const nBlocksPerDay = 432000/15;
  const tokenSymbol = Symbols['GOLD'];
  const tokenCollection = USDCollections['GOLD'];
  const currentTimestamp = new Date();
  currentTimestamp.setUTCHours(0,0,0,0);

  try {
    const result = await getTokenPrice(tokenCollection, tokenSymbol, currentTimestamp);
    const currentOHLC = result.ohlc[result.ohlc.length - 1];
    const price = currentOHLC.close;
    const time = currentOHLC.time;
    let totalSalaryPerBlock = 0;

    for (let i = 0; i < level.length; i++) {
      totalSalaryPerBlock += computeSalaryPerBlock([primaryStat[i], secondaryStat[i]], level[i]);
    };

    const totalSalaryPerDay = totalSalaryPerBlock*nBlocksPerDay;
    const totalSalaryPer15Days = totalSalaryPerBlock*nBlocksPerDay*15;
    const totalSalaryPerMonth = totalSalaryPerBlock*nBlocksPerDay*30;
    const totalDollarsPerDay = price*totalSalaryPerDay;
    const totalDollarsPer15Days = price*totalSalaryPer15Days;
    const totalDollarsPerMonth = price*totalSalaryPerMonth;
    
    let responseMsg = '';
    responseMsg += `Computation at 100% mining ratio\n\n`
    responseMsg += `GOLD/block: ${totalSalaryPerBlock.toFixed(3)}\n`
    responseMsg += `GOLD/day: ${totalSalaryPerDay.toFixed(2)}\n`
    responseMsg += `GOLD/15days: ${totalSalaryPer15Days.toFixed(2)}\n`
    responseMsg += `GOLD/month: ${totalSalaryPerMonth.toFixed(2)}\n\n`
    responseMsg += `USD/day: ${totalDollarsPerDay.toFixed(2)}\n`
    responseMsg += `USD/15days: ${totalDollarsPer15Days.toFixed(2)}\n`
    responseMsg += `USD/month: ${totalDollarsPerMonth.toFixed(2)}\n\n`
    responseMsg += `Pair: ${tokenCollection}\n`;
    responseMsg += `Timestamp: ${time.toISOString()}\n`;
    responseMsg += `Price: $${price}`;
    bot.sendMessage(chatId, responseMsg);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, 'Internal server error.');
  };

});

// Check account with chatID
bot.onText(/\/account/, async (msg) => {
  const chatId = msg.chat.id;
  const chatType = msg.chat.type;
  let userChatId;

  if (chatType == 'group') {
    userChatId = msg.from.id;
  } else {
    userChatId = chatId;
  }

  const collectionName = 'bnx-accounts';

  try {
    const res = await checkAccountWithChatID(collectionName, userChatId);
    if (res === null || res === undefined) {
      bot.sendMessage(chatId, 'Account not registered!');
    } else {
      let responseMsg = '';
      responseMsg += `User: ${res.username}\n`;
      responseMsg += `Address: ${res.address}\n`;
      responseMsg += `Tokens: ${JSON.stringify(res.tokens)}\n`;
      bot.sendMessage(chatId, responseMsg);
    }
  } catch(err) {
    console.error(err);
    bot.sendMessage(chatId, 'Internal server error.');
  }

});

// Create new account
bot.onText(/\/newAccount (.+) (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const chatType = msg.chat.type;
  let userChatId;

  if (chatType == 'group') {
    userChatId = msg.from.id;
  } else {
    userChatId = chatId;
  }

  const username = match[1];
  const address = match[2];
  const collectionName = 'bnx-accounts';

  try {
    let responseMsg = '';
    let res = await checkAccount(collectionName, username);

    if (res === null || res === undefined) {
      await insertAccount(collectionName, username, address, userChatId);
      res = await checkAccount(collectionName, username);
      responseMsg += `Account registered!\n\n`;
    } else {
      responseMsg += `Account already registered!\n\n`;
    }

    responseMsg += `User: ${res.username}\n`;
    responseMsg += `Address: ${res.address}\n`;
    responseMsg += `Tokens: ${JSON.stringify(res.tokens)}\n`;
    bot.sendMessage(chatId, responseMsg);
  } catch(err) {
    console.error(err);
    bot.sendMessage(chatId, 'Internal server error.');
  }

});

// Add token to account using chatID
bot.onText(/\/addToken (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const chatType = msg.chat.type;
  let userChatId;

  if (chatType == 'group') {
    userChatId = msg.from.id;
  } else {
    userChatId = chatId;
  }

  const tokenID = match[1];
  const collectionName = 'bnx-accounts';

  try {
    const res = await checkAccountWithChatID(collectionName, userChatId);

    if (res === null || res === undefined) {
      bot.sendMessage(chatId, 'Account not registered!')
    } else {
      await updateAccountTokens(collectionName, 'add', res.username, tokenID);
      bot.sendMessage(chatId, 'Accounts\' tokens updated!');
    }
  } catch(err) {
    console.error(err);
    bot.sendMessage(chatId, 'Internal server error.');
  }

});

// Remove token from account using chatID
bot.onText(/\/rmToken (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const chatType = msg.chat.type;
  let userChatId;

  if (chatType == 'group') {
    userChatId = msg.from.id;
  } else {
    userChatId = chatId;
  }

  const tokenID = match[1];
  const collectionName = 'bnx-accounts';

  try {
    const res = await checkAccountWithChatID(collectionName, userChatId);

    if (res === null || res === undefined) {
      bot.sendMessage(chatId, 'Account not registered!')
    } else {
      await updateAccountTokens(collectionName, 'rmv', res.username, tokenID);
      bot.sendMessage(chatId, 'Accounts\' tokens updated!');
    }
  } catch(err) {
    console.error(err);
    bot.sendMessage(chatId, 'Internal server error.');
  }

});

// Get work info using chatID
bot.onText(/\/w/, async (msg) => {
  const chatId = msg.chat.id;
  const chatType = msg.chat.type;
  let userChatId;

  if (chatType == 'group') {
    userChatId = msg.from.id;
  } else {
    userChatId = chatId;
  }

  const collectionName = 'bnx-accounts';
  const nBlocksPerDay = 432000/15;
  const tokenSymbol = Symbols['GOLD'];
  const tokenCollection = USDCollections['GOLD'];
  const currentTimestamp = new Date();
  currentTimestamp.setUTCHours(0,0,0,0);

  try {
    const res = await checkAccountWithChatID(collectionName, userChatId);

    if (res === null || res === undefined) {
      bot.sendMessage(chatId, 'Account not registered!')
      return;
    }

    const result = await getTokenPrice(tokenCollection, tokenSymbol, currentTimestamp);
    const currentOHLC = result.ohlc[result.ohlc.length - 1];
    const price = currentOHLC.close;
    const time = currentOHLC.time;

    const heroes = [];
    let totalSalaryPerBlock = 0;
    let totalIncome = 0;

    for (let tokenID of res.tokens) {
      const heroInfo = await fetchHeroInfo(tokenID);
      const heroRoleName = roleToName[heroInfo[1]];
      const heroWork = await fetchHeroWork(tokenID);
      const currentBlockNumber = await web3.eth.getBlockNumber(); 
      const heroIncome = await fetchHeroIncome(
          heroInfo[0],
          heroWork.careerAddr,
          heroWork.startTime,
          currentBlockNumber
      );
      const primaryStats = getPrimaryStats(heroInfo[1], heroInfo[0]);
      totalSalaryPerBlock += computeSalaryPerBlock([primaryStats[0], primaryStats[1]], heroInfo[0][6]);

      const heroStatsSummary = primaryStats.join('/') + '/' + heroInfo[0][6];
      const heroMiningTimeInDays = ((currentBlockNumber-parseInt(heroWork.startTime))/nBlocksPerDay).toFixed(1);
      const heroIncomeParsed = web3.utils.fromWei(heroIncome);
      totalIncome += parseFloat(heroIncomeParsed);

      heroes.push({
        Role: heroRoleName,
        Stats: heroStatsSummary,
        Time: heroMiningTimeInDays,
        Balance: heroIncomeParsed
      });
    }

    const totalIncomeUSD = price*totalIncome;
    const totalSalaryPerDay = totalSalaryPerBlock*nBlocksPerDay;
    const totalSalaryPer15Days = totalSalaryPerBlock*nBlocksPerDay*15;
    const totalSalaryPerMonth = totalSalaryPerBlock*nBlocksPerDay*30;
    const totalDollarsPerDay = price*totalSalaryPerDay;
    const totalDollarsPer15Days = price*totalSalaryPer15Days;
    const totalDollarsPerMonth = price*totalSalaryPerMonth;
    
    let responseMsg = '';
    responseMsg += `Computation at 100% mining ratio\n\n`
    responseMsg += `GOLD/block: ${totalSalaryPerBlock.toFixed(3)}\n`
    responseMsg += `GOLD/day: ${totalSalaryPerDay.toFixed(2)}\n`
    responseMsg += `GOLD/15days: ${totalSalaryPer15Days.toFixed(2)}\n`
    responseMsg += `GOLD/month: ${totalSalaryPerMonth.toFixed(2)}\n\n`
    responseMsg += `USD/day: ${totalDollarsPerDay.toFixed(2)}\n`
    responseMsg += `USD/15days: ${totalDollarsPer15Days.toFixed(2)}\n`
    responseMsg += `USD/month: ${totalDollarsPerMonth.toFixed(2)}\n\n`
    responseMsg += `Pair: ${tokenCollection}\n`;
    responseMsg += `Timestamp: ${time.toISOString()}\n`;
    responseMsg += `Price: $${price}\n\n`;
    responseMsg += `Current GOLD balance: ${totalIncome}\n`;
    responseMsg += `Current USD balance: $${totalIncomeUSD.toFixed(2)}\n\n`;
    responseMsg += stringTable.create(heroes);
    bot.sendMessage(chatId, responseMsg);
  } catch(err) {
    console.error(err);
    bot.sendMessage(chatId, 'Internal server error.');
  }

});