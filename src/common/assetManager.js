import { parseEther, getContract } from 'viem';
import { readJson } from './utils.js';
import { getPublicClient, getWalletClient, supportEIP1559 } from './client.js';

const erc20Abi = readJson('abi/IERC20.json');

export async function transferEth(walletClient, account, to, amount) {
    return await walletClient.sendTransaction({
        account: account,
        to: to,
        value: parseEther(amount),
    });
}

export async function collectEth(walletClient, publicClient, account, to) {
    // 获取账户当前余额
    const balance = await publicClient.getBalance({ address: account.address });
    
    // 估算gas费用 (支持EIP-1559)
    const gasLimit = 21000n;
    let gasFee;
    
    if (supportEIP1559(publicClient)) {
        // 尝试获取EIP-1559费用估算
        const feeData = await publicClient.estimateFeesPerGas();
        // 计算最大可能的gas费用 = (maxFeePerGas) * gasLimit
        gasFee = feeData.maxFeePerGas * gasLimit;
    } else {
        // 如果链不支持EIP-1559，回退到传统的gas计算方式
        const gasPrice = await publicClient.getGasPrice();
        gasFee = gasPrice * gasLimit;
    }
    
    // 计算可发送的最大金额，确保保留足够的gas费
    const maxAmount = balance > gasFee ? balance - gasFee : 0n;
    
    // 检查余额是否足够支付gas费用
    if (balance <= gasFee || maxAmount === 0n) {
        return {
            success: false,
            reason: "余额不足以支付交易费用",
            balance: balance.toString(),
            gasFee: gasFee.toString()
        };
    }
    
    // 发送剩余ETH到指定地址
    return await walletClient.sendTransaction({
        account: account,
        to: to,
        value: maxAmount,
    });
}

export async function balanceOf(publicClient, address) {
    return await publicClient.getBalance({ address: address });
}

// 多次rpc请求，批量查询
export async function multiBalanceOf(publicClient, addresses) {
    const balancePromises = addresses.map(address => 
        publicClient.getBalance({ address })
    );
    
    return Promise.all(balancePromises);
}

export async function tokenBalanceOf(publicClient, tokenAddress, address) {
    const contract = getContract({
        address: tokenAddress,
        abi: erc20Abi,
        client: publicClient,
    });

    return await contract.read.balanceOf([address]);
}

// 单次rpc请求，批量查询
export async function multiTokenBalanceOf(publicClient, tokenAddress, addresses) {
     const contract = getContract({
        address: tokenAddress,
        abi: erc20Abi,
        client: publicClient,
    });

    const calls = [];

    for (const address of addresses) {
        calls.push(contract.read.balanceOf([address]));
    }

    const results = await Promise.all(calls);

    return results;
}