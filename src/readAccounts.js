import { getAllAccounts } from './common/account.js';

async function main() {
    const accounts = getAllAccounts();
    console.log(accounts);
}

main();
