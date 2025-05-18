import { createPublicClient, createWalletClient, http } from 'viem';
import { mainnet, sepolia, bsc, bscTestnet } from 'viem/chains';
import dotenv from 'dotenv';
dotenv.config();

// 缓存已创建的客户端实例
const publicClientCache = {};
const walletClientCache = {};

export function getPublicClient(network) {
    // 如果缓存中已有此网络的客户端实例，则直接返回
    if (publicClientCache[network]) {
        return publicClientCache[network];
    }

    let client;
    if (network === 'mainnet') {
        client = createPublicClient({
            batch: {
                multicall: true,
            },
            chain: mainnet,
            transport: http(process.env.MAINNET_NETWORK)
        });
    } else if (network === 'sepolia') {
        client = createPublicClient({
             batch: {
                multicall: true,
            },
            chain: sepolia,
            transport: http(process.env.SEPOLIA_NETWORK)
        });
    } else if (network === 'bsc') {
        client = createPublicClient({
             batch: {
                multicall: true,
            },
            chain: bsc,
            transport: http(process.env.BSC_NETWORK)
        });
    } else {
        client = createPublicClient({
             batch: {
                multicall: true,
            },
            chain: bscTestnet,
            transport: http(process.env.BSCTEST_NETWORK)
        });
    }

    // 将新创建的客户端存入缓存
    publicClientCache[network] = client;
    return client;
}

export function getWalletClient(network) {
    // 如果缓存中已有此网络的客户端实例，则直接返回
    if (walletClientCache[network]) {
        return walletClientCache[network];
    }

    let client;
    if (network === 'mainnet') {
        client = createWalletClient({
            chain: mainnet,
            transport: http(process.env.MAINNET_NETWORK)
        });
    } else if (network === 'sepolia') {
        client = createWalletClient({
            chain: sepolia,
            transport: http(process.env.SEPOLIA_NETWORK)
        });
    } else if (network === 'bsc') {
        client = createWalletClient({
            chain: bsc,
            transport: http(process.env.BSC_NETWORK)
        });
    } else {
        client = createWalletClient({
            chain: bscTestnet,
            transport: http(process.env.BSCTEST_NETWORK)
        });
    }

    // 将新创建的客户端存入缓存
    walletClientCache[network] = client;
    return client;
}

const legacyChainIds = [bsc.id, bscTestnet.id];
export function supportEIP1559(publicClient) {
    return !legacyChainIds.includes(publicClient.chain.id);
}