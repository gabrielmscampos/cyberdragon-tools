import { roleAddress } from '../blockchain/addr.js';

const getPrimaryStats = (heroRoleAddr, heroStats) => {

  const s = [];

  if (heroRoleAddr === roleAddress.Warrior) {
    const str = parseInt(heroStats[0]);
    const con = parseInt(heroStats[2]);
    s.push(str);
    s.push(con);
  } else if (heroRoleAddr === roleAddress.Robber) {
    const agi = parseInt(heroStats[1]);
    const str = parseInt(heroStats[0]);
    s.push(agi);
    s.push(str);
  } else if (heroRoleAddr === roleAddress.Mage) {
    const int = parseInt(heroStats[4]);
    const spi = parseInt(heroStats[5]);
    s.push(int);
    s.push(spi);
  } else if (heroRoleAddr === roleAddress.Ranger) {
    const str = parseInt(heroStats[0]);
    const agi = parseInt(heroStats[1]);
    s.push(str);
    s.push(agi);
  } else {
    console.error(`roleAddress (${heroRoleAddr}) not implemented.`)
    throw 400;
  }

  return s
}

const computeSalaryPerBlock = (primaryStats, level) => {
  
  const p = primaryStats[0];
  const s = primaryStats[1];

  if (level == 0) return 0;
  else if (level == 1) return 0.01;
  else if (p < 86 || s < 60) return 0.01*level;
  else return (2**(level-1))*(0.01 + (p-85)*0.005);
};

export {
  getPrimaryStats,
  computeSalaryPerBlock
};