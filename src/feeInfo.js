import { getPublicClient } from './common/client.js';

async function main() {
    
    const client = getPublicClient('bsctest');
    const gasPrice = await client.getGasPrice();
    console.log(gasPrice);

    const sepoliaClient = getPublicClient('sepolia');
    const { maxFeePerGas, maxPriorityFeePerGas } = await sepoliaClient.estimateFeesPerGas();
    console.log(maxFeePerGas, maxPriorityFeePerGas);
}

main();
