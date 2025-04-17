import { getWalletClient, getPublicClient } from './common/client.js';
import { getLocalAccount, getAllAccounts } from './common/account.js';
import { transferEth, balanceOf, multiBalanceOf } from './common/assetManager.js';

async function main() {
    const walletClient = getWalletClient('bsctest');
    const publicClient = getPublicClient('bsctest');

    const account = getLocalAccount();
    const accounts = getAllAccounts();
    const balances = await multiBalanceOf(publicClient, accounts);
    console.log(balances);
    // for (const addr of accounts) {
    //     const balance = await balanceOf(publicClient, addr);
    //     console.log(addr, balance);
    //     // const tx = await transferEth(walletClient, account, addr, '0.01');
    //     // console.log(tx);
    // }
}
main();