import { 
  generateAccounts, 
  getAllAccounts, 
  decryptPrivateKey, 
  getAccountFromKeystores, 
  getLocalAccount,
  importAccount
} from '../common/account.js';
import { readJson } from "../common/utils.js";

function createAccount() {
  const config = readJson('config.json');
  const accounts = generateAccounts(config.number, config.password);
  console.log(accounts);
}

function getKeystoresAccounts() {
  const accounts = getAllAccounts();
  console.log(accounts);
}

function getPrivateKey() {
  const config = readJson('config.json');
  const privateKey = decryptPrivateKey('0xA6979e4E5442ceca3fC73A31878Ca4e42178D802', config.password);
  console.log(privateKey);
}

function getAccountObject() {
  const config = readJson('config.json');
  const account = getAccountFromKeystores('0xA6979e4E5442ceca3fC73A31878Ca4e42178D802', config.password);
  console.log(account);
}

function getLocalAccountObject() {
  const account = getLocalAccount();
  console.log(account);
}

function testImportAccount() {
  const config = readJson('config.json');
  const account = importAccount('0x89dda6f901905b13f1bd13335fc105f5520814996a3d899403afb4dd086a47e3', config.password);
  console.log(account);
}

// node src/exmpales/accountExample.js
async function main() {
  // createAccount();

  // getKeystoresAccounts();

  // getPrivateKey();

  // getAccountObject();

  // getLocalAccountObject();

  testImportAccount();
}

main();
