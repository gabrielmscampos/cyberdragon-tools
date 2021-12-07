import TelegramBot from 'node-telegram-bot-api';
import stringTable from 'string-table';

import { USDCollections, Symbols } from '../api/db/symbols.js'
import { getAccount, putAccount, deleteAccount, updateAccount, updateAccountTokens, getTokenPrice } from '../api/db/mongo.js'
import { web3, roleToName, fetchHeroInfo, fetchHeroWork, fetchHeroIncome } from '../api/blockchain/chain.js'
import { getPrimaryStats, computeSalaryPerBlock, goldMiningRatio } from '../api/bnx/salary.js'

// Create a bot that uses 'polling' to fetch new updates
const tokenTelegramBot = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(tokenTelegramBot, {polling: true});
bot.on("polling_error", console.log);

// Mongo db collection
const collectionName = 'bnx-accounts-telegram-bot';

// Start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  let response = '';
  response += '/t - Get token price at the moment using PancakeSwap RouterV2\n';
  response += '/c - Compute hero monetary income\n';
  response += '/cl - Compute monetary income of multiple heroes\n';
  response += '/account - Check account status\n';
  response += '/newAccount - Register new account\n';
  response += '/deleteAccount - Delete existing account\n';
  response += '/addToken - Register one or more heroes into account\n';
  response += '/rmToken - Remove one or more heroes from account\n';
  response += '/w - Show account monetary income and current gold balance\n';
  response += '/tokenInfo - Show one or more heroes monetary statistics without registering\n';
  response += '\n';
  response += 'Use /help {command} to check how to use.';
  bot.sendMessage(chatId, response)
})

// Help
bot.onText(/\/help (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const command = match[1];

  let response = '';
  if (command === 't') {
    response += '/t - Get token price at the moment using PancakeSwap RouterV2\n\n';
    response += 'Example usage: /t {token}\n\n';
    response += 'Available values for {token}: bnb, bnx, gold, ironkey'
  } else if (command === 'c') {
    response += '/c - Compute hero monetary income\n\n';
    response += 'Example usage: /c {p} {s} {l}\n\n';
    response += '{p}: Hero primary stat\n';
    response += '{s}: Hero secondary stat\n';
    response += '{l}: Hero level\n';
  } else if (command === 'cl') {
    response += '/cl - Compute monetary income of multiple heroes\n\n';
    response += 'Example usage: /cl {p1},{p2},... {s1},{s2},... {l1},{l2},...\n\n';
    response += '{p1},{p2},...: Heroes primary stat\n';
    response += '{s1},{p2},...: Heroes secondary stat\n';
    response += '{l1},{p2},...: Heroes level\n';
  } else if (command === 'account') {
    response += '/account - Check account status\n\n';
    response += 'Example usage: /account\n\n';
  } else if (command === 'newAccount') {
    response += '/newAccount - Register new account\n\n';
    response += 'Example usage: /newAccount\n\n';
  } else if (command === 'deleteAccount') {
    response += '/deleteAccount - Delete existing account\n\n';
    response += 'Example usage: /deleteAccount\n\n';
  } else if (command === 'addToken') {
    response += '/addToken - Register one or more heroes into account\n\n';
    response += 'Example usage: /addToken {tokenID}\n\n';
    response += '{tokenID}: Hero tokenID, if multiple use command (,) as separator\n';
  } else if (command === 'rmToken') {
    response += '/rmToken - Remove one or more heroes from account\n\n';
    response += 'Example usage: /rmToken {tokenID}\n\n';
    response += '{tokenID}: Hero tokenID, if multiple use command (,) as separator\n';
  } else if (command === 'w') {
    response += '/w - Show account monetary income and current gold balance\n\n';
    response += 'Example usage: /w\n\n';
  } else if (command === 'tokenInfo') {
    response += '/tokenInfo - Show one or more heroes monetary statistics without registering\n\n';
    response += 'Example usage: /tokenInfo {tokenID}\n\n';
    response += '{tokenID}: Hero tokenID, if multiple use command (,) as separator\n';
  } else {
    response += `Command \/${command} is invalid, use /start to list available commands.\n\n`;
  }

  bot.sendMessage(chatId, response)
})

// Get token price ATM
bot.onText(/\/t (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const tokenName = match[1];

  if (tokenName === null || tokenName === undefined) {
    bot.sendMessage(chatId, 'Token not available!');
    return;
  }

  // Translate to token collection and get current timestamp
  const tokenSymbol = Symbols[tokenName.toUpperCase()];

  if (tokenSymbol === undefined) {
    bot.sendMessage(chatId, 'Token not available!');
    return;
  }

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

  if (primaryStat === null || primaryStat === undefined) {
    bot.sendMessage(chatId, 'Primary stat not defined!');
    return;
  }

  if (secondaryStat === null || secondaryStat === undefined) {
    bot.sendMessage(chatId, 'Secondary stat not defined!');
    return;
  }

  if (level === null || level === undefined) {
    bot.sendMessage(chatId, 'Level stat not defined!');
    return;
  }

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
    const goldRatio = goldMiningRatio(price);

    const salaryPerBlock = goldRatio*computeSalaryPerBlock([primaryStat, secondaryStat], level);
    const salaryPerDay = salaryPerBlock*nBlocksPerDay;
    const salaryPer15Days = salaryPerBlock*nBlocksPerDay*15;
    const salaryPerMonth = salaryPerBlock*nBlocksPerDay*30;
    const dollarsPerDay = price*salaryPerDay;
    const dollarsPer15Days = price*salaryPer15Days;
    const dollarsPerMonth = price*salaryPerMonth;
    
    let responseMsg = '';
    responseMsg += `Computation at ${goldRatio*100}% mining ratio\n\n`
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

  if (primaryStat === null || primaryStat === undefined) {
    bot.sendMessage(chatId, 'Primary stat not defined!');
    return;
  }

  if (secondaryStat === null || secondaryStat === undefined) {
    bot.sendMessage(chatId, 'Secondary stat not defined!');
    return;
  }

  if (level === null || level === undefined) {
    bot.sendMessage(chatId, 'Level stat not defined!');
    return;
  }

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
    const goldRatio = goldMiningRatio(price);
    let totalSalaryPerBlock = 0;

    for (let i = 0; i < level.length; i++) {
      totalSalaryPerBlock += goldRatio*computeSalaryPerBlock([primaryStat[i], secondaryStat[i]], level[i]);
    };

    const totalSalaryPerDay = totalSalaryPerBlock*nBlocksPerDay;
    const totalSalaryPer15Days = totalSalaryPerBlock*nBlocksPerDay*15;
    const totalSalaryPerMonth = totalSalaryPerBlock*nBlocksPerDay*30;
    const totalDollarsPerDay = price*totalSalaryPerDay;
    const totalDollarsPer15Days = price*totalSalaryPer15Days;
    const totalDollarsPerMonth = price*totalSalaryPerMonth;
    
    let responseMsg = '';
    responseMsg += `Computation at ${goldRatio*100}% mining ratio\n\n`
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

  try {
    const res = await getAccount(collectionName, userChatId);
    let responseMsg = '';
    responseMsg += `id: ${res._id.toString()}\n`;
    responseMsg += `userID: ${res.chatID}\n`;
    responseMsg += `Tokens: ${JSON.stringify(res.tokens)}\n`;
    bot.sendMessage(chatId, responseMsg);
  } catch(err) {
    if (err === 404) {
      bot.sendMessage(chatId, 'Account not registered!');
    } else {
      console.error(err);
      bot.sendMessage(chatId, 'Internal server error.');
    }
  }

});

// Create new account
bot.onText(/\/newAccount/, async (msg, match) => {
  const chatId = msg.chat.id;
  const chatType = msg.chat.type;
  let userChatId;

  if (chatType == 'group') {
    userChatId = msg.from.id;
  } else {
    userChatId = chatId;
  }

  try {
    await putAccount(collectionName, userChatId);
    bot.sendMessage(chatId, 'Account registered! Add token with /addToken');
  } catch(err) {
    if (err === 400) {
      bot.sendMessage(chatId, 'Account already registered!');
    } else {
      console.error(err);
      bot.sendMessage(chatId, 'Internal server error.');
    }
  }

});

// Delete account
bot.onText(/\/deleteAccount/, async (msg, match) => {
  const chatId = msg.chat.id;
  const chatType = msg.chat.type;
  let userChatId;

  if (chatType == 'group') {
    userChatId = msg.from.id;
  } else {
    userChatId = chatId;
  }

  try {
    await deleteAccount(collectionName, userChatId);
    bot.sendMessage(chatId, 'Account deleted!');
  } catch(err) {
    if (err === 400) {
      bot.sendMessage(chatId, 'Account not registered!');
    } else {
      console.error(err);
      bot.sendMessage(chatId, 'Internal server error.');
    }
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

  const tokenID = match[1].split(',');
  if (tokenID === null || tokenID === undefined) {
    bot.sendMessage(chatId, 'Token ID not defined!');
    return;
  }

  for (let tok of tokenID) {
    if (tok.length < 75 || tok.length > 80) {
      bot.sendMessage(chatId, `tokenID ${tok} might be invalid!`);
      return;
    }
  }

  try {
    await updateAccountTokens(collectionName, 'add', userChatId, tokenID);
    bot.sendMessage(chatId, 'Token(s) successfuly added! Use /w to check your returns and current income.');
  } catch(err) {
    if (err === 400) {
      bot.sendMessage(chatId, 'Account not registered! Register using /newAccount');
    } else {
      console.error(err);
      bot.sendMessage(chatId, 'Internal server error.');
    }
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

  const tokenID = match[1].split(',');
  if (tokenID === null || tokenID === undefined) {
    bot.sendMessage(chatId, 'Token ID not defined!');
    return;
  }
  
  for (let tok of tokenID) {
    if (tok.length < 75 || tok.length > 80) {
      bot.sendMessage(chatId, `tokenID ${tok} might be invalid!`);
      return;
    }
  }

  try {
    await updateAccountTokens(collectionName, 'rmv', userChatId, tokenID);
    bot.sendMessage(chatId, 'Token(s) successfuly removed!');
  } catch(err) {
    if (err === 400) {
      bot.sendMessage(chatId, 'Account not registered! Register using /newAccount');
    } else {
      console.error(err);
      bot.sendMessage(chatId, 'Internal server error.');
    }
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

  const nBlocksPerDay = 432000/15;
  const tokenSymbol = Symbols['GOLD'];
  const tokenCollection = USDCollections['GOLD'];
  const currentTimestamp = new Date();
  currentTimestamp.setUTCHours(0,0,0,0);

  try {
    const account = await getAccount(collectionName, userChatId);
    const result = await getTokenPrice(tokenCollection, tokenSymbol, currentTimestamp);
    const currentOHLC = result.ohlc[result.ohlc.length - 1];
    const price = currentOHLC.close;
    const time = currentOHLC.time;
    const goldRatio = goldMiningRatio(price);

    const heroes = [];
    let totalSalaryPerBlock = 0;
    let totalIncome = 0;

    for (let tokenID of account.tokens) {

      if (tokenID.length < 75 || tokenID.length > 80) {
        bot.sendMessage(chatId, `tokenID ${tokenID} is invalid! Remove with /rmToken ${tokenID}`);
        return;
      }

      const heroInfo = await fetchHeroInfo(tokenID);
      const heroRoleName = roleToName[heroInfo[1]];
      const heroWork = await fetchHeroWork(tokenID);
      const currentBlockNumber = await web3.eth.getBlockNumber(); 
      const heroIncome = await fetchHeroIncome(
          heroInfo[0],
          heroWork.workType,
          heroWork.startTime,
          currentBlockNumber
      );

      let primaryStats;
      let heroStatsSummary;

      try {
        primaryStats = getPrimaryStats(heroInfo[1], heroInfo[0]);
        totalSalaryPerBlock += goldRatio*computeSalaryPerBlock([primaryStats[0], primaryStats[1]], heroInfo[0][6]);
        heroStatsSummary = primaryStats.join('/') + '/' + heroInfo[0][6];
      } catch (err) {
        if (err === 400) {
          totalSalaryPerBlock += 0;
          heroStatsSummary = 'NA/NA/' + heroInfo[0][6];
        } else {
          throw err;
        }
      }

      const heroMiningTimeInDays = heroIncome.isWorking ? ((currentBlockNumber-parseInt(heroWork.startTime))/nBlocksPerDay).toFixed(1) : 'NA';
      const heroIncomeParsed = web3.utils.fromWei(heroIncome.value);
      const heroGoldBalance = heroIncome.isWorking ? heroIncomeParsed : 'NA';
      totalIncome += parseFloat(heroIncomeParsed);

      heroes.push({
        Role: heroRoleName,
        Stats: heroStatsSummary,
        Time: heroMiningTimeInDays,
        Gold: parseFloat(heroGoldBalance).toFixed(2)
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
    responseMsg += `Computation at ${goldRatio*100}% mining ratio\n\n`
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
    if (err === 404) {
      bot.sendMessage(chatId, 'Account not registered!');
    } else {
      console.error(err);
      bot.sendMessage(chatId, 'Internal server error.');
    }
  }

});

// Get work info using chatID
bot.onText(/\/tokenInfo (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const tokens = match[1].split(',').filter((v, i, a) => a.indexOf(v) === i);

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
    const goldRatio = goldMiningRatio(price);

    const heroes = [];
    const owners = [];
    let totalSalaryPerBlock = 0;
    let totalIncome = 0;

    for (let tokenID of tokens) {

      if (tokenID.length < 75 || tokenID.length > 80) {
        bot.sendMessage(chatId, `tokenID ${tokenID} is invalid! Remove with /rmToken ${tokenID}`);
        return;
      }

      const heroInfo = await fetchHeroInfo(tokenID);
      const heroRoleName = roleToName[heroInfo[1]];
      const heroWork = await fetchHeroWork(tokenID);
      const currentBlockNumber = await web3.eth.getBlockNumber(); 
      const heroIncome = await fetchHeroIncome(
          heroInfo[0],
          heroWork.workType,
          heroWork.startTime,
          currentBlockNumber
      );

      let primaryStats;
      let heroStatsSummary;

      try {
        primaryStats = getPrimaryStats(heroInfo[1], heroInfo[0]);
        totalSalaryPerBlock += goldRatio*computeSalaryPerBlock([primaryStats[0], primaryStats[1]], heroInfo[0][6]);
        heroStatsSummary = primaryStats.join('/') + '/' + heroInfo[0][6];
      } catch (err) {
        if (err === 400) {
          totalSalaryPerBlock += 0;
          heroStatsSummary = 'NA/NA/' + heroInfo[0][6];
        } else {
          throw err;
        }
      }

      const heroMiningTimeInDays = heroIncome.isWorking ? ((currentBlockNumber-parseInt(heroWork.startTime))/nBlocksPerDay).toFixed(1) : 'NA';
      const heroIncomeParsed = web3.utils.fromWei(heroIncome.value);
      const heroGoldBalance = heroIncome.isWorking ? heroIncomeParsed : 'NA';
      totalIncome += parseFloat(heroIncomeParsed);

      heroes.push({
        Role: heroRoleName,
        Stats: heroStatsSummary,
        Time: heroMiningTimeInDays,
        Gold: parseFloat(heroGoldBalance).toFixed(2)
      });

      owners.indexOf(heroWork.owner) === -1 ? owners.push(heroWork.owner) : null;
    }

    const totalIncomeUSD = price*totalIncome;
    const totalSalaryPerDay = totalSalaryPerBlock*nBlocksPerDay;
    const totalSalaryPer15Days = totalSalaryPerBlock*nBlocksPerDay*15;
    const totalSalaryPerMonth = totalSalaryPerBlock*nBlocksPerDay*30;
    const totalDollarsPerDay = price*totalSalaryPerDay;
    const totalDollarsPer15Days = price*totalSalaryPer15Days;
    const totalDollarsPerMonth = price*totalSalaryPerMonth;
    
    let responseMsg = '';
    responseMsg += `Computation at ${goldRatio*100}% mining ratio\n\n`
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
    responseMsg += '\n\n';
    responseMsg += 'Owners addresses:\n\n';
    for (let own of owners) {
      responseMsg += `${own}\n`;
    }

    bot.sendMessage(chatId, responseMsg);
  } catch(err) {
    if (err === 404) {
      bot.sendMessage(chatId, 'Account not registered!');
    } else {
      console.error(err);
      bot.sendMessage(chatId, 'Internal server error.');
    }
  }

});
