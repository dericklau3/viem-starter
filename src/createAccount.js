import { generateAccounts } from './common/account.js';
import { readJson } from "./common/utils.js";

async function main() {
  const config = readJson('config.json');
  const accounts = generateAccounts(config.number, config.password);
  console.log(accounts);
}

main();
