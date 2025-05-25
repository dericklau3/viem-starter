import { getPublicClient } from '../common/client.js';
import { scanEvent } from '../common/event.js';
import { getRedisUtil } from '../common/redisUtil.js';
import { getLogger } from '../common/logger.js';

const REDIS_KEY_BLOCK_HEIGHT = 'bsc:scan:last_block';
const DEFAULT_BLOCK_START = 49887922; // 默认开始区块高度
const BLOCKS_PER_SCAN = 5000; // 每次扫描的区块数量
const CONTRACT_ADDRESS = '0x5c952063c7fc8610FFDB798152D69F0B9550762b'; // 合约地址
const EVENT_SIGNATURE = 'event LiquidityAdded(address token0, uint256 amount0, address token1, uint256 amount1)';
const REDIS_KEY_PREFIX = 'bsc:';

/**
 * 区块扫描服务
 */
class BlockScanService {
  constructor() {
    this.redisUtil = getRedisUtil();
    this.publicClient = getPublicClient('bsc');
    this.logger = getLogger('BlockScanService');
  }

  /**
   * 获取扫描起始区块
   * @returns {Promise<number>} 起始区块高度
   */
  async getStartBlock() {
    // 确保 Redis 连接可用
    this.logger.info('确保 Redis 连接可用...');
    const isConnected = await this.redisUtil.ensureConnection();
    
    if (!isConnected) {
      throw new Error('Redis 连接失败，无法获取起始区块');
    }
    
    this.logger.info('Redis 连接已确认可用');
    
    const lastBlock = await this.redisUtil.get(REDIS_KEY_BLOCK_HEIGHT);
    if (lastBlock) {
      return parseInt(lastBlock) + 1; // 从上次扫描的下一个区块开始
    }
    return DEFAULT_BLOCK_START;
  }

  /**
   * 更新最后扫描的区块高度
   * @param {number} blockHeight 区块高度
   */
  async updateLastBlock(blockHeight) {
    await this.redisUtil.set(REDIS_KEY_BLOCK_HEIGHT, blockHeight.toString());
    this.logger.info(`已更新最后扫描区块高度: ${blockHeight}`);
  }

  /**
   * 存储事件数据到Redis
   * @param {Array} events 事件数据数组
   */
  async saveEvents(events) {
    if (!events || events.length === 0) {
      return;
    }

    for (const event of events) {
        const key = event.args.token0;
      
      // 提取事件参数
      const eventData = {
        blockNumber: Number(event.blockNumber),
        transactionHash: event.transactionHash,
        token1: event.args.token1,
      };
      
      // 存储到Redis
      await this.redisUtil.set(`${REDIS_KEY_PREFIX}${key}`, eventData, 259200);
      this.logger.info(`已保存事件: ${key}`);
    }
  }

  /**
   * 扫描事件
   */
  async scanEvents() {
    try {
      const startBlock = await this.getStartBlock();
      // 获取链上最新区块
      const latestBlock = Number(await this.publicClient.getBlockNumber());
      
      // 计算本次扫描的结束区块
      let endBlock = startBlock + BLOCKS_PER_SCAN - 1;
      if (endBlock > latestBlock) {
        endBlock = latestBlock;
      }
      
      // 如果没有新区块，则跳过
      if (startBlock > endBlock) {
        this.logger.info('没有新区块需要扫描');
        return;
      }
      
      this.logger.info(`开始扫描区块: ${startBlock} 到 ${endBlock}`);
      
      // 扫描事件
      const events = await scanEvent(
        this.publicClient,
        CONTRACT_ADDRESS,
        EVENT_SIGNATURE,
        startBlock,
        endBlock
      );
      
      this.logger.info(`扫描到 ${events.length} 个事件`);
      
      // 保存事件
      await this.saveEvents(events);
      
      // 更新最后扫描的区块高度
      await this.updateLastBlock(endBlock);
      
      return endBlock;
    } catch (error) {
      this.logger.error('扫描事件出错:', error);
      throw error;
    }
  }

  /**
   * 关闭连接
   */
  close() {
    // 不关闭Redis连接，因为Redis连接是全局共享的
    // 只有在进程退出时才关闭Redis连接
    this.logger.info('BlockScanService已关闭');
  }
}

export default BlockScanService; 