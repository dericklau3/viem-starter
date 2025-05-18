import { getWalletClient, getPublicClient } from '../common/client.js';
import { getLocalAccount, getAccountFromKeystores } from '../common/account.js';
import { transferEth, balanceOf, multiBalanceOf, tokenBalanceOf, multiTokenBalanceOf, collectEth } from '../common/assetManager.js';
import { readJson } from "../common/utils.js";

async function testTransferEth() {
    const config = readJson('config.json');

    // legacy transaction
    const walletClient = getWalletClient('bsctest');
    const account = getAccountFromKeystores('0xA6979e4E5442ceca3fC73A31878Ca4e42178D802', config.password);
    const tx = await transferEth(walletClient, account, '0x4408e1c6745B43350711317C89Db35B479992e5C', '0.005');
    console.log(tx);

    // EIP-1559 transaction
    const sepoliaWalletClient = getWalletClient('sepolia');
    const sepoliaTx = await transferEth(sepoliaWalletClient, account, '0x4408e1c6745B43350711317C89Db35B479992e5C', '0.005');
    console.log(sepoliaTx);
}

async function testBalanceOf() {
    const publicClient = getPublicClient('bsctest');
    const accountAddress = '0xA6979e4E5442ceca3fC73A31878Ca4e42178D802';
    const balance = await balanceOf(publicClient, accountAddress);
    console.log(balance);
}

async function testMultiBalanceOf() {
    const publicClient = getPublicClient('sepolia');
    const accounts = ['0xA6979e4E5442ceca3fC73A31878Ca4e42178D802', '0xA6979e4E5442ceca3fC73A31878Ca4e42178D802'];
    const balances = await multiBalanceOf(publicClient, accounts);
    console.log(balances);
}

async function testTokenBalanceOf() {
    const publicClient = getPublicClient('bsctest');
    const tokenAddress = '0xc48105A8BC482ade2822ED2c4159Cc85AF1249A1';
    const address = '0xA6979e4E5442ceca3fC73A31878Ca4e42178D802';
    const balance = await tokenBalanceOf(publicClient, tokenAddress, address);
    console.log(balance);
}

async function testMultiTokenBalanceOf() {
    const publicClient = getPublicClient('bsctest');
    const tokenAddress = '0xc48105A8BC482ade2822ED2c4159Cc85AF1249A1';
    const addresses = ['0xA6979e4E5442ceca3fC73A31878Ca4e42178D802', '0xA6979e4E5442ceca3fC73A31878Ca4e42178D802'];
    const balances = await multiTokenBalanceOf(publicClient, tokenAddress, addresses);
    console.log(balances);
}

async function testCollectEth() {
    const config = readJson('config.json');
    const walletClient = getWalletClient('bsctest');
    const publicClient = getPublicClient('bsctest');

    const sepoliaWalletClient = getWalletClient('sepolia');
    const sepoliaPublicClient = getPublicClient('sepolia');
    
    const account = getAccountFromKeystores("0xA6979e4E5442ceca3fC73A31878Ca4e42178D802", config.password);

    const tx = await collectEth(walletClient, publicClient, account, '0x4408e1c6745B43350711317C89Db35B479992e5C');
    console.log(tx);

    const sepoliaTx = await collectEth(sepoliaWalletClient, sepoliaPublicClient, account, '0x4408e1c6745B43350711317C89Db35B479992e5C');
    console.log(sepoliaTx);
}


// node src/exmpales/assetManagerExmaple.js
async function main() {
    // await testTransferEth();

    // await testBalanceOf();

    // await testMultiBalanceOf();

    // await testTokenBalanceOf();

    // await testMultiTokenBalanceOf();

    await testCollectEth();

    // const walletClient = getWalletClient('bsctest');
    // const publicClient = getPublicClient('bsctest');

    // const account = getLocalAccount();
    // const accounts = getAllAccounts();
    // const balances = await multiBalanceOf(publicClient, accounts);
    // console.log(balances);
    // for (const addr of accounts) {
    //     const balance = await balanceOf(publicClient, addr);
    //     console.log(addr, balance);
    //     // const tx = await transferEth(walletClient, account, addr, '0.01');
    //     // console.log(tx);
    // }
}
main();