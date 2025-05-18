import { parseAbiItem } from 'viem';

export async function scanEvent(publicClient, contractAddress, eventStr, fromBlock, toBlock) {

    const logs = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem(eventStr), // eventStr = "event Transfer(address indexed from, address indexed to, uint256 value)"
        fromBlock: BigInt("0x" + Number(fromBlock).toString(16)), // 转换为十六进制并添加0x前缀
        toBlock: BigInt("0x" + Number(toBlock).toString(16)) // 转换为十六进制并添加0x前缀
    });
    return logs;
}