import Web3 from 'web3';

import { gameCoreAddress, roleAddress, workAddress } from './addr.js';
import { binaryXAbi } from './abi.js';

const web3 = new Web3("https://bsc-dataseed.binance.org");

const Contracts = {
  NewPlayInfo: new web3.eth.Contract(binaryXAbi["55cb"], gameCoreAddress.NewPlayInfo),
  NewMining: new web3.eth.Contract(binaryXAbi["2261"], gameCoreAddress.NewMining),
  Blacksmith: new web3.eth.Contract(binaryXAbi["f28f"], workAddress.blacksmith),
  Rangework: new web3.eth.Contract(binaryXAbi["f28f"], workAddress.Rangework),
  Hunter: new web3.eth.Contract(binaryXAbi["de8d"], workAddress.hunter),
  Bookmanger: new web3.eth.Contract(binaryXAbi["40ac"], workAddress.bookmanger)
}

const roleToContract = {
  [roleAddress.Warrior]: Contracts.Blacksmith,
  [roleAddress.Robber]: Contracts.Hunter,
  [roleAddress.Mage]: Contracts.Bookmanger,
  [roleAddress.Ranger]: Contracts.Rangework
}

const roleToName = {
  [roleAddress.Warrior]: 'Warrior',
  [roleAddress.Robber]: 'Rogue',
  [roleAddress.Mage]: 'Mage',
  [roleAddress.Ranger]: 'Ranger'
}

const fetchHeroInfo = async (tokenID) => {
  return await Contracts.NewPlayInfo.methods.getPlayerInfoBySet(tokenID).call();
};

const fetchHeroWork = async (tokenID) => {
  return await Contracts.NewMining.methods.getPlayerWork(tokenID).call();
};

const fetchHeroIncome = async (heroStatistics, heroRoleAddress, heroWorkStartBlock, currentBlockNumber) => {
  const workContract = roleToContract[heroRoleAddress];
  return await workContract.methods.getIncome(
    heroStatistics,
    heroWorkStartBlock,
    currentBlockNumber
  ).call(); // Args -> (heroStats, startTime, currentBlockNumber)
};

export {
  web3,
  roleToContract,
  roleToName,
  fetchHeroInfo,
  fetchHeroWork,
  fetchHeroIncome
}