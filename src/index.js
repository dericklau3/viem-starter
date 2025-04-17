import { getAccountFromKeystores, getAllAccounts } from './common/account.js';
import { readJson } from "./common/utils.js";
import { getPublicClient, getWalletClient } from './common/client.js';
import { parseEther, parseGwei } from 'viem';

async function main() {
    const config = readJson('config.json');

    const accounts = getAllAccounts();

    for (const accountAddr of accounts) {
        const account = getAccountFromKeystores(accountAddr, config.password);

        const walletClient = getWalletClient('bsctest');
        const tx = await walletClient.sendTransaction({
            account: account,
            to: '0x4408e1c6745B43350711317C89Db35B479992e5C',
            value: parseEther('0.001'),
            gasPrice: parseGwei("9")
        });
        console.log(tx);
    }
}

main();
