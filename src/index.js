import { getAccountFromKeystores } from './common/account.js';
import { readJson } from "./common/utils.js";
import { getPublicClient, getWalletClient } from './common/client.js';
import { parseEther, parseGwei } from 'viem';

async function main() {
    const config = readJson('config.json');
    const account = getAccountFromKeystores("0x2b80e87a5F73f9219aa204dc6c2Dcab06c6d163e", config.password);
    console.log(account);
    
    const client = getPublicClient('bsctest');
    const balance = await client.getBalance({ address: account.address });
    console.log(balance);

    const walletClient = getWalletClient('bsctest');
    const tx = await walletClient.sendTransaction({
        account: account,
        to: '0x2b80e87a5F73f9219aa204dc6c2Dcab06c6d163e',
        value: parseEther('0'),
        gasPrice: parseGwei("12")
    });
    console.log(tx);
}

main();
