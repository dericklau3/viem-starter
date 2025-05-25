import BlockScanService from './blockScanService.js';
import { calculateTokenMarketCap } from './calculateTokenMarketCap.js';
import { getRedisUtil } from '../common/redisUtil.js';

/**
 * 定时扫描区块链上的LiquidityAdded事件
 * 
 * 使用方法: node src/business/scanLiquidityEvents.js
 */
async function main() {
  console.log('开始执行LiquidityAdded事件扫描...');
  
  const blockScanService = new BlockScanService();
  
  try {
    // 第一次扫描
    await blockScanService.scanEvents();
    
    // 第一次计算市值
    console.log('开始计算代币市值...');
    await calculateTokenMarketCap();
    
    // 设置定时任务，每10分钟扫描一次
    const scanIntervalId = setInterval(async () => {
      try {
        await blockScanService.scanEvents();
      } catch (error) {
        console.error('定时扫描出错:', error);
      }
    }, 600000); // 10分钟
    
    // 设置计算市值的定时任务，每5分钟执行一次
    const marketCapIntervalId = setInterval(async () => {
      try {
        console.log('定时计算代币市值...');
        await calculateTokenMarketCap();
      } catch (error) {
        console.error('计算市值出错:', error);
      }
    }, 300000); // 5分钟
    
    // 处理进程退出
    process.on('SIGINT', () => {
      clearInterval(scanIntervalId);
      clearInterval(marketCapIntervalId);
      blockScanService.close();
      getRedisUtil().close(); // 关闭Redis连接
      console.log('扫描服务已停止');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      clearInterval(scanIntervalId);
      clearInterval(marketCapIntervalId);
      blockScanService.close();
      getRedisUtil().close(); // 关闭Redis连接
      console.log('扫描服务已停止');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('扫描服务启动出错:', error);
    blockScanService.close();
    process.exit(1);
  }
}

// 执行主函数
main().catch(error => {
  console.error('程序执行出错:', error);
  process.exit(1);
}); 