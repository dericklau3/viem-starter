import { createPublicClient, createWalletClient, http } from 'viem';
import { mainnet, sepolia, bsc, bscTestnet } from 'viem/chains';
import dotenv from 'dotenv';
dotenv.config();

export function getPublicClient(network) {
    if (network === 'mainnet') {
        return createPublicClient({
            chain: mainnet,
            transport: http(process.env.MAINNET_NETWORK)
        });
    } else if (network === 'sepolia') {
        return createPublicClient({
            chain: sepolia,
            transport: http(process.env.SEPOLIA_NETWORK)
        });
    } else if (network === 'bsc') {
        return createPublicClient({
            chain: bsc,
            transport: http(process.env.BSC_NETWORK)
        });
    } else {
        return createPublicClient({
            chain: bscTestnet,
            transport: http(process.env.BSCTEST_NETWORK)
        });
    }
}

export function getWalletClient(network) {
    if (network === 'mainnet') {
        return createWalletClient({
            chain: mainnet,
            transport: http(process.env.MAINNET_NETWORK)
        });
    } else if (network === 'sepolia') {
        return createWalletClient({
            chain: sepolia,
            transport: http(process.env.SEPOLIA_NETWORK)
        });
    } else if (network === 'bsc') {
        return createWalletClient({
            chain: bsc,
            transport: http(process.env.BSC_NETWORK)
        });
    } else {
        return createWalletClient({
            chain: bscTestnet,
            transport: http(process.env.BSCTEST_NETWORK)
        });
    }
}