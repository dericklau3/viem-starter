import { OKXDexClient } from '@okx-dex/okx-dex-sdk';
import { getPublicClient } from '../common/client.js';
import { readJson } from "../common/utils.js";
import { getLocalPrivateKey } from '../common/account.js';
import { parseEther } from 'viem';

// node src/examples/dexExample.js
async function main() {
    const config = readJson('config.json');
    const publicClient = getPublicClient("bsc");
    console.log(publicClient.transport.url);

    const client = new OKXDexClient({
        apiKey: config.okx.apiKey,
        secretKey: config.okx.apiSecret,
        apiPassphrase: config.okx.apiPassphrase,
        projectId: config.okx.projectId,
        evm: {
            connection: {
                rpcUrl: publicClient.transport.url,
            },
            walletAddress: '0x4408e1c6745B43350711317C89Db35B479992e5C',
            privateKey: getLocalPrivateKey(),
        }
    });

    const TOKENS = {
        USDT: '0x55d398326f99059fF775485246999027B3197955',
        WETH: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'
    };

    const quote = await client.dex.getQuote({
        chainId: '56',  // BNB Chain
        fromTokenAddress: TOKENS.WETH,
        toTokenAddress: TOKENS.USDT,
        amount: parseEther('1'),  // 1 USDT
        slippage: '0.5'     // 0.5%
    });

    console.log(quote);

    // const approval = await client.dex.executeApproval({
    //     chainId: '8453',
    //     tokenContractAddress: TOKENS.USDC,
    //     approveAmount: '1000000'
    // });

    // const evmSwap = await client.dex.executeSwap({
    //     chainId: '8453',
    //     fromTokenAddress,
    //     toTokenAddress,
    //     amount: rawAmount,
    //     slippage: '0.5',
    //     userWalletAddress: process.env.EVM_WALLET_ADDRESS
    // });
}

main();