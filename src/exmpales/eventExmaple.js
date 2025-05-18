import { getPublicClient } from '../common/client.js';
import { scanEvent } from '../common/event.js';

async function main() {
    const publicClient = getPublicClient("bsc");

    const logs = await scanEvent(
        publicClient,
        "0x5c952063c7fc8610FFDB798152D69F0B9550762b",
        "event LiquidityAdded(address indexed token0, uint256 amount0, address indexed token1, uint256 amount1)",
        49877626,
        49877628
    );
    console.log(logs);
    
}

main().catch(error => {
    console.error("执行出错:", error);
});