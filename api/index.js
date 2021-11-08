import {
  web3,
  roleToName,
  fetchHeroInfo,
  fetchHeroWork,
  fetchHeroIncome
} from './blockchain/chain.js'
import { getPrimaryStats, computeSalaryPerBlock } from './bnx/salary.js'
import { fetchWorkingTokens } from './bnx/work.js'
import {
  checkAccount,
  insertAccount,
  deleteAccount,
  updateAccountTokens,
  updateAccountChat,
  getTokenPrice
} from './db/mongo.js'
import { USDCollections, Symbols } from './db/symbols.js'

let collectionName = 'bnx-accounts';
let username = 'gamoreir';
let account = '0x692d439f9451316276cF40717991F1c33BF175F2';
let tokenID1 = '77048303454219599145288778338542229948499387929593178227373580014068752631246';
let tokenID2 = '97088435566813472948411252872513847408227355424307362687991969674766917500162';
let chatID = '123456'

checkAccount(collectionName, username, account).then( async (res) => {

  if (res === null || res === undefined) {
    console.log(`Account ${username} do not exists, creating...`)
    await insertAccount(collectionName, username, account);
    res = await checkAccount(collectionName, username, account);
  } else {
    console.log(`Account ${username} already registered.`);
  }

  console.log('Account', res);

  // Add tokens
  await updateAccountTokens(collectionName, 'add', username, tokenID1);
  await updateAccountTokens(collectionName, 'add', username, tokenID2);
  res = await checkAccount(collectionName, username, account);

  console.log('Account', res);

  // Remove token
  // await updateAccountTokens(collectionName, 'rmv', username, tokenID2);
  // res = await checkAccount(collectionName, username, account);

  // console.log('Account', res);

  // Update chatID
  await updateAccountChat(collectionName, username, chatID);
  res = await checkAccount(collectionName, username, account);

  console.log('Account', res);

  // Fetch tokens [CLOUDFLARE BLOCKING]
  // const tokens = await fetchWorkingTokens(account);
  // console.log(tokens);

  // Get hero info
  const heroInfo = await fetchHeroInfo(tokenID1);
  console.log('heroInfo', heroInfo);

  // Hero role name
  const heroRoleName = roleToName[heroInfo[1]];
  console.log('heroRoleName', heroRoleName);

  // Get hero work
  const heroWork = await fetchHeroWork(tokenID1);
  console.log('heroWork', heroWork);

  // Get hero income
  const currentBlockNumber = await web3.eth.getBlockNumber(); 
  const heroIncome = await fetchHeroIncome(
      heroInfo[0],
      heroWork.careerAddr,
      heroWork.startTime,
      currentBlockNumber
  );
  console.log('blockNumber', currentBlockNumber);
  console.log('heroIncome', heroIncome, web3.utils.fromWei(heroIncome));

  // Compute salary per block
  const primaryStats = getPrimaryStats(heroInfo[1], heroInfo[0]);
  const salaryPerBlock = computeSalaryPerBlock(primaryStats, heroInfo[0][6]);
  console.log('salaryPerBlock', salaryPerBlock);
  console.log('salary per day', salaryPerBlock*432000/15);
  console.log('salary per 15 days', salaryPerBlock*432000);

  // Fetch token price ATM
  const token = 'gold';
  const tokenSymbol = Symbols[token.toUpperCase()];
  const tokenCollection = USDCollections[tokenSymbol.toUpperCase()];
  const currentTimestamp = new Date();
  currentTimestamp.setUTCHours(0,0,0,0);

  const result = await getTokenPrice(tokenCollection, tokenSymbol, currentTimestamp);
  const price = result.ohlc[result.ohlc.length - 1].close
  console.log(`${tokenCollection} price:`, price);

  // Compute dollars per day/ half-month/ month
  console.log('dollars per day', price*salaryPerBlock*432000/15);
  console.log('dollars per 15 days', price*salaryPerBlock*432000);
  console.log('dollars per month', price*salaryPerBlock*432000*2);

});