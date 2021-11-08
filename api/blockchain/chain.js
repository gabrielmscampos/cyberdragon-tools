import Web3 from 'web3';

import { gameCoreAddress, roleAddress, workAddress } from './addr.js';
import { binaryXAbi } from './abi.js';

const web3 = new Web3("https://bsc-dataseed.binance.org");

const Contracts = {
  PlayInfo: new web3.eth.Contract(binaryXAbi["55cb"], gameCoreAddress.PlayInfo),
  Mining: new web3.eth.Contract(binaryXAbi["2261"], gameCoreAddress.Mining),
  NewPlayInfo: new web3.eth.Contract(binaryXAbi["55cb"], gameCoreAddress.NewPlayInfo),
  NewMining: new web3.eth.Contract(binaryXAbi["2261"], gameCoreAddress.NewMining),
  Datie: new web3.eth.Contract(binaryXAbi["3718"], workAddress.Datie),
  Bulie: new web3.eth.Contract(binaryXAbi["661c"], workAddress.Bulie),
  Tushu: new web3.eth.Contract(binaryXAbi["b835"], workAddress.Tushu),
  Lgong: new web3.eth.Contract(binaryXAbi["f28f"], workAddress.Linggong),
  Blacksmith: new web3.eth.Contract(binaryXAbi["f28f"], workAddress.blacksmith),
  Rangework: new web3.eth.Contract(binaryXAbi["f28f"], workAddress.Rangework),
  Hunter: new web3.eth.Contract(binaryXAbi["de8d"], workAddress.hunter),
  Bookmanger: new web3.eth.Contract(binaryXAbi["40ac"], workAddress.bookmanger),
  Gaoji: new web3.eth.Contract(binaryXAbi["c332"], workAddress.Gaoji),
  Sixth: new web3.eth.Contract(binaryXAbi["c332"], workAddress.Sixth),
  Seventh: new web3.eth.Contract(binaryXAbi["c332"], workAddress.Seventh)
}

const workToContract = {
  [workAddress.Datie]: Contracts.Datie,
  [workAddress.Bulie]: Contracts.Bulie,
  [workAddress.Tushu]: Contracts.Tushu,
  [workAddress.Linggong]: Contracts.Lgong,
  [workAddress.blacksmith]: Contracts.Blacksmith,
  [workAddress.hunter]: Contracts.Hunter,
  [workAddress.bookmanger]: Contracts.Bookmanger,
  [workAddress.Rangework]: Contracts.Rangework,
  [workAddress.Gaoji]: Contracts.Gaoji,
  [workAddress.Sixth]: Contracts.Sixth,
  [workAddress.Seventh]: Contracts.Seventh,
}

const roleToName = {
  [roleAddress.Warrior]: 'Warrior',
  [roleAddress.Robber]: 'Rogue',
  [roleAddress.Mage]: 'Mage',
  [roleAddress.Ranger]: 'Ranger',
  [roleAddress.Katrina]: 'Katrina'
}

const fetchHeroInfo = async (tokenID) => {
  const heroInfo = await Contracts.NewPlayInfo.methods.getPlayerInfoBySet(tokenID).call();
  if (heroInfo[1] === '0x0000000000000000000000000000000000000000') {
    return await Contracts.PlayInfo.methods.getPlayerInfoBySet(tokenID).call();
  } else {
    return heroInfo
  }
};

const fetchHeroWork = async (tokenID) => {
  const heroWork = await Contracts.NewMining.methods.getPlayerWork(tokenID).call();
  if (heroWork.workType === '0x0000000000000000000000000000000000000000') {
    return await Contracts.Mining.methods.getPlayerWork(tokenID).call();
  } else {
    return heroWork
  }
};

const fetchHeroIncome = async (
  heroStatistics,
  heroWorkAddress,
  heroWorkStartBlock,
  currentBlockNumber
  ) => {
  if (heroWorkAddress === '0x0000000000000000000000000000000000000000') {
    return {
      value: '0000000000000000000000',
      isWorking: false
    }
  } else {
    const workContract = workToContract[heroWorkAddress];
    const heroIncome = await workContract.methods.getIncome(
      heroStatistics,
      heroWorkStartBlock,
      currentBlockNumber
    ).call(); // Args -> (heroStats, startTime, currentBlockNumber)
    return {
      value: heroIncome,
      isWorking: true
    }
  }
};

export {
  web3,
  workToContract,
  roleToName,
  fetchHeroInfo,
  fetchHeroWork,
  fetchHeroIncome
}