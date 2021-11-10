import { web3, roleToName, fetchHeroInfo, fetchHeroWork, fetchHeroIncome } from './blockchain/chain.js'
import { getPrimaryStats, computeSalaryPerBlock } from './bnx/salary.js'
import { getAccount, putAccount, deleteAccount, updateAccount, updateAccountTokens, getTokenPrice } from './db/mongo.js'
import { USDCollections, Symbols } from './db/symbols.js'

const collectionName = 'bnx-accounts-telegram-bot';
const chatID = '000000000';
const tokenIDs = [
  '77048303454219599145288778338542229948499387929593178227373580014068752631246',
  '97088435566813472948411252872513847408227355424307362687991969674766917500162',
  '54920811139364593725549824606618877455993621990400323580078613040592177135519',
  '71136236125506732212258737774207465607559611659399690943572474877896966579657', // Katrina level 1 not working (2021-09-07)
  '86224047802425358601991411298201506029505464240674115846081659132714159734939'  // Katrina level 5 royal guard (2021-09-07)
];

// Example usage
(async () => {

  // Register an account
  try {
    await putAccount(collectionName, chatID);
    console.log('Account', await getAccount(collectionName, chatID))
  } catch(err) {
    console.log(`Account ${chatID} already registered!`)
    console.log('Account', await getAccount(collectionName, chatID))
  }

  // Adding multiple tokens
  await updateAccountTokens(collectionName, 'add', chatID, tokenIDs)

  // Select token id
  let tokenID = tokenIDs[2]

  // Get hero info
  const heroInfo = await fetchHeroInfo(tokenID);
  console.log('heroInfo', heroInfo);

  // Hero role name
  const heroRoleName = roleToName[heroInfo[1]];
  console.log('heroRoleName', heroRoleName);

  // Get hero work
  const heroWork = await fetchHeroWork(tokenID);
  console.log('heroWork', heroWork);

  // Get hero income
  const currentBlockNumber = await web3.eth.getBlockNumber(); 
  const heroIncome = await fetchHeroIncome(
      heroInfo[0],
      heroWork.workType,
      heroWork.startTime,
      currentBlockNumber
  );
  console.log('blockNumber', currentBlockNumber);
  console.log('heroIncome', heroIncome.value, web3.utils.fromWei(heroIncome.value), heroIncome.isWorking);

  // Compute salary per block
  let salaryPerBlock;

  try {
    const primaryStats = getPrimaryStats(heroInfo[1], heroInfo[0]);
    salaryPerBlock = computeSalaryPerBlock(primaryStats, heroInfo[0][6]);
  } catch(err) {
    if (err === 400) {
      console.warn('Hero role not supported. Defaultin salary per block to 0.01');
      salaryPerBlock = 0.01;
    } else {
      console.error('Internal server error.');
      throw 500;
    }
  }

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

})();
