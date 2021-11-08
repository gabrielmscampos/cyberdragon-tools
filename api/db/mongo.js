import MongoDB from 'mongodb';

import { stageConfig } from './config.js';

const STAGE_PARAMETER = process.env.STAGE;
const mongoClient = MongoDB.MongoClient;
const mongoURL = stageConfig[STAGE_PARAMETER].URL;
const mongoDBName = stageConfig[STAGE_PARAMETER].DB_NAME;

const checkAccount = async (collectionName, username, account) => {

  let query = { username: username };

  if (account !== null && account !== undefined) {
    query['address'] = account;
  }

  const client = await mongoClient.connect(mongoURL);
  const collection = client.db(mongoDBName).collection(collectionName);
  const result = await collection.findOne(query);
  client.close();

  return result;
};

const checkAccountWithChatID = async (collectionName, chatID) => {

  let query = { chatID: chatID };

  const client = await mongoClient.connect(mongoURL);
  const collection = client.db(mongoDBName).collection(collectionName);
  const result = await collection.findOne(query);
  client.close();

  return result;
};

const insertAccount = async (collectionName, username, address, chatID) => {

  const document = {
    username: username,
    address: address,
    chatID: chatID,
    tokens: []
  };

  const client = await mongoClient.connect(mongoURL);
  const collection = client.db(mongoDBName).collection(collectionName);
  const result = await collection.insertOne(document);
  client.close();

  return result;
};

const deleteAccount = async (collectionName, username) => {

  const query = { username: username };

  const client = await mongoClient.connect(mongoURL);
  const collection = client.db(mongoDBName).collection(collectionName);
  const result = await collection.deleteOne(query);
  client.close();

  return result;
};

const updateAccountChat = async (collectionName, username, chatID) => {

  const values = { $set: { chatID: chatID } };
  const query = { username: username };

  const client = await mongoClient.connect(mongoURL);
  const collection = client.db(mongoDBName).collection(collectionName);
  await collection.updateOne(query, values);
  client.close();
};

const updateAccountTokens = async (collectionName, operation, username, tokenID) => {

  let values;
  const query = { username: username };
  if (operation === 'add') {
    values = { $addToSet: { tokens: tokenID } }; // push to array only if not exists
  } else if (operation === 'rmv') {
    values = { $pull: { tokens: tokenID } };
  } else {
    throw 400;
  }

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
  checkAccount,
  checkAccountWithChatID,
  insertAccount,
  deleteAccount,
  updateAccountTokens,
  updateAccountChat,
  getTokenPrice
};
