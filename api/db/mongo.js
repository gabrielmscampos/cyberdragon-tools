import MongoDB from 'mongodb';

import { stageConfig } from './config.js';

const STAGE_PARAMETER = process.env.STAGE;
const mongoClient = MongoDB.MongoClient;
const mongoURL = stageConfig[STAGE_PARAMETER].URL;
const mongoDBName = stageConfig[STAGE_PARAMETER].DB_NAME;

const getAccount = async (collectionName, chatID) => {

  // query object
  const query = { chatID: chatID };

  // connect, find and close
  const client = await mongoClient.connect(mongoURL);
  const collection = client.db(mongoDBName).collection(collectionName);
  const result = await collection.findOne(query);
  client.close();

  if (result === null) {
    throw 404; // Not found
  }

  return result;
};

const putAccount = async (collectionName, chatID) => {

  // If account do not exists, continue if throw 404
  try {
    await getAccount(collectionName, chatID);
    throw 400; // Bad request
  } catch (err) {
    if (err !== 404) {
      throw 500; // Internal server error
    }
  }

  // empty document
  const document = { chatID: chatID, tokens: [] };

  // connect, insert and close
  const client = await mongoClient.connect(mongoURL);
  const collection = client.db(mongoDBName).collection(collectionName);
  const result = await collection.insertOne(document);
  client.close();

  return result;
};

const deleteAccount = async (collectionName, chatID) => {

  // If account exists (do not throw 404), continue
  try {
    await getAccount(collectionName, chatID);
  } catch (err) {
    if (err === 404) {
      throw 400; // Bad request
    }
  }

  // query object
  const query = { chatID: chatID };

  // connect, delete and close
  const client = await mongoClient.connect(mongoURL);
  const collection = client.db(mongoDBName).collection(collectionName);
  const result = await collection.deleteOne(query);
  client.close();

  return result;
};

const updateAccount = async (collectionName, _id, chatID) => {

  // If account exists (do not throw 404), continue
  try {
    await getAccount(collectionName, chatID);
  } catch (err) {
    if (err === 404) {
      throw 400; // Bad request
    }
  }

  // query object and values to change
  const values = { $set: { chatID: chatID } };
  const query = { _id: _id };

  // connect, update and close
  const client = await mongoClient.connect(mongoURL);
  const collection = client.db(mongoDBName).collection(collectionName);
  const result = await collection.updateOne(query, values);
  client.close();

  return result;
};

const updateAccountTokens = async (collectionName, operation, chatID, tokenID) => {

  // If account exists (do not throw 404), continue
  try {
    await getAccount(collectionName, chatID);
  } catch (err) {
    if (err === 404) {
      throw 400; // Bad request
    }
  }

  // update values to change with operation method
  let values;
  let tokensOp;
  const query = { chatID: chatID };
  if (operation === 'add') {
    tokensOp = Array.isArray(tokenID) ? { tokens: { $each: tokenID } } : { tokens: tokenID };
    values = { $addToSet: tokensOp }; // $push to array only if not exists
  } else if (operation === 'rmv') {
    values = Array.isArray(tokenID) ? { $pullAll: { tokens: tokenID } } : { $pull: { tokens: tokenID } };
  } else {
    throw 400;
  }

  // connect, update and close
  const client = await mongoClient.connect(mongoURL);
  const collection = client.db(mongoDBName).collection(collectionName);
  await collection.updateOne(query, values);
  client.close();
};

const getTokenPrice = async (collectionName, symbol, currentTimestamp) => {

  let query = { symbol: symbol };

  if (currentTimestamp !== null && currentTimestamp !== undefined) {
    query['timestamp'] = currentTimestamp.toISOString();
  }

  const client = await mongoClient.connect(mongoURL);
  const collection = client.db(mongoDBName).collection(collectionName);
  const result = await collection.findOne(query);
  client.close();

  return result;
};

export {
  mongoClient,
  mongoURL,
  putAccount,
  getAccount,
  deleteAccount,
  updateAccount,
  updateAccountTokens,
  getTokenPrice
};
