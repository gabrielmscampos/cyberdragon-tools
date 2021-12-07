import { roleAddress } from '../blockchain/addr.js';

const goldMiningRatio = (price) => {

  if (price <= 0.0001) return 0.06/100
  else if (price <= 0.0002) return 0.25/100
  else if (price <= 0.0003) return 0.56/100
  else if (price <= 0.0004) return 1.00/100
  else if (price <= 0.0005) return 1.56/100
  else if (price <= 0.0006) return 2.25/100
  else if (price <= 0.0007) return 3.06/100
  else if (price <= 0.0008) return 4.00/100
  else if (price <= 0.0009) return 5.06/100
  else if (price <= 0.0010) return 6.25/100
  else if (price <= 0.0011) return 7.56/100
  else if (price <= 0.0012) return 9.00/100
  else if (price <= 0.0013) return 10.56/100
  else if (price <= 0.0014) return 12.25/100
  else if (price <= 0.0015) return 14.06/100
  else if (price <= 0.0016) return 16.00/100
  else if (price <= 0.0017) return 18.06/100
  else if (price <= 0.0018) return 20.25/100
  else if (price <= 0.0019) return 22.56/100
  else if (price <= 0.0020) return 25.00/100
  else if (price <= 0.0021) return 27.56/100
  else if (price <= 0.0022) return 30.25/100
  else if (price <= 0.0023) return 33.06/100
  else if (price <= 0.0024) return 36.00/100
  else if (price <= 0.0025) return 39.06/100
  else if (price <= 0.0026) return 42.25/100
  else if (price <= 0.0027) return 45.56/100
  else if (price <= 0.0028) return 49.00/100
  else if (price <= 0.0029) return 52.56/100
  else if (price <= 0.0030) return 56.25/100
  else if (price <= 0.0031) return 60.06/100
  else if (price <= 0.0032) return 64.00/100
  else if (price <= 0.0033) return 68.06/100
  else if (price <= 0.0034) return 72.25/100
  else if (price <= 0.0035) return 76.56/100
  else if (price <= 0.0036) return 81.00/100
  else if (price <= 0.0037) return 85.56/100
  else if (price <= 0.0038) return 90.25/100
  else if (price <= 0.0039) return 95.06/100
  else return 100/100

}

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
  computeSalaryPerBlock,
  goldMiningRatio
};