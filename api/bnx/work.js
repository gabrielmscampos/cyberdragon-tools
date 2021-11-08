import Axios from 'axios';

import { workAddress } from '../blockchain/addr.js';

const workAddressArray = Object.values(workAddress);

const fetchWorkingTokens = async (address) => {
  let workList = [];
  for (let wk of workAddressArray) {
    let url = `https://game.binaryx.pro/minev2/getWorks?address=${address}&work_type=${wk}`;
    let response = await Axios.get(url);
    let result = response.data.data.result;
    if (result === null) continue; 
    for (let i = 0; i < result.length; i++) {
      workList.push(result[i].token_id)
    }
  }
  return workList;
};

export { fetchWorkingTokens };