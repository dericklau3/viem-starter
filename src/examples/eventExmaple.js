import { getPublicClient } from '../common/client.js';
import { scanEvent } from '../common/event.js';
import { decodeEventLog, parseAbi } from 'viem'

// node src/examples/eventExmaple.js
async function main() {
    const publicClient = getPublicClient("bsc");

    const logs = await scanEvent(
        publicClient,
        "0x5c952063c7fc8610FFDB798152D69F0B9550762b",
        "event LiquidityAdded(address token0, uint256 amount0, address token1, uint256 amount1)",
        49877626,
        49882626
    );
    console.log(logs);

    const decoded = decodeEventLog({
        abi: parseAbi([EVENT_SIGNATURE]),
        data: logs[0].data,
        topics: logs[0].topics
    });

    console.log(decoded);
}

main().catch(error => {
    console.error("执行出错:", error);
});