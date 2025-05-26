import { getPublicClient } from '../common/client.js';
import { getRedisUtil } from '../common/redisUtil.js';
import { parseAbi, getContract } from 'viem';
import axios from 'axios';

// Pancake Factory和WBNB地址
const PANCAKE_FACTORY = '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73';
const WBNB = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
const USDT = '0x55d398326f99059fF775485246999027B3197955';
const USD1 = '0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d';

// Chainlink BNB/USD Price Feed地址
const BNB_USD_PRICE_FEED = '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE';

// ABI定义
const TOKEN_ABI = parseAbi([
  'function name() external view returns (string memory)',
  'function symbol() external view returns (string memory)'
]);

const FACTORY_ABI = parseAbi([
  'function getPair(address tokenA, address tokenB) external view returns (address pair)'
]);

const PAIR_ABI = parseAbi([
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)'
]);

const CHAINLINK_ABI = parseAbi([
  'function latestAnswer() external view returns (int256 answer)'
]);

const TOKEN_TOTAL_SUPPLY = 1_000_000_000; // 10亿

/**
 * 获取Token的市值信息
 * 
 * 使用方法: node src/business/calculateTokenMarketCap.js
 */
export async function calculateTokenMarketCap() {
  const redisUtil = getRedisUtil();
  const publicClient = getPublicClient('bsc');
  
  try {
    // 确保 Redis 连接可用
    console.log('确保 Redis 连接可用...');
    const isConnected = await redisUtil.ensureConnection();
    
    if (!isConnected) {
      throw new Error('Redis 连接失败，无法执行市值计算');
    }
    
    console.log('Redis 连接已确认可用，开始计算市值...');
    
    // 获取所有事件键
    const keys = await redisUtil.client.keys('bsc:0x*');
    
    // 获取BNB的美元价格
    const bnbPrice = await getBnbPrice(publicClient);
    
    // 提取token地址
    const tokenAddresses = keys.map(key => key.replace('bsc:', ''));

    const quotoTokens = [];
    for (const key of keys) {
      const value = await redisUtil.client.get(key);
      const jsonValue = JSON.parse(value);
      const token1 = jsonValue.token1;
      if (token1.toLowerCase() === USDT.toLowerCase() || token1.toLowerCase() === USD1.toLowerCase()) {
        quotoTokens.push(token1);
      } else {
        quotoTokens.push(WBNB);
      }
    }

    const tokenNames = await batchGetTokenName(publicClient, tokenAddresses);
    const tokenSymbols = await batchGetTokenSymbol(publicClient, tokenAddresses);
    
    // 批量获取与WBNB的交易对地址
    const pairAddresses = await batchGetPairAddresses(publicClient, tokenAddresses, quotoTokens);
    
    // 过滤有效的交易对
    const validPairs = [];
    for (let i = 0; i < tokenAddresses.length; i++) {
      if (pairAddresses[i] !== '0x0000000000000000000000000000000000000000') {
        validPairs.push({
          tokenName: tokenNames[i],
          tokenSymbol: tokenSymbols[i],
          tokenAddress: tokenAddresses[i],
          quotoToken: quotoTokens[i],
          pairAddress: pairAddresses[i]
        });
      } else {
        console.log(`${tokenAddresses[i]} 没有有效交易对`);
      }
    }
    
    // 批量获取交易对信息
    if (validPairs.length > 0) {
      // 批量获取token0地址
      const token0Addresses = await batchGetToken0(publicClient, validPairs.map(pair => pair.pairAddress));
      
      // 批量获取交易对储备
      const reserves = await batchGetReserves(publicClient, validPairs.map(pair => pair.pairAddress));
      
      // 计算价格和市值
      for (let i = 0; i < validPairs.length; i++) {
        const { tokenName, tokenSymbol, tokenAddress, quotoToken, pairAddress } = validPairs[i];
        const token0 = token0Addresses[i];
        const [reserve0, reserve1] = reserves[i];
        
        // 根据token顺序计算价格
        let tokenPrice;
        const isUsdStablecoin = quotoToken.toLowerCase() === USDT.toLowerCase() || 
                                quotoToken.toLowerCase() === USD1.toLowerCase();
        
        if (token0.toLowerCase() === tokenAddress.toLowerCase()) {
          // token是token0，另一个代币是token1
          tokenPrice = Number(reserve1) / Number(reserve0);
        } else {
          // token是token1，另一个代币是token0
          tokenPrice = Number(reserve0) / Number(reserve1);
        }
        
        // 计算美元价格
        let tokenPriceInUsd;
        if (isUsdStablecoin) {
          // 如果交易对是USD稳定币，直接使用计算出的价格
          tokenPriceInUsd = tokenPrice;
        } else {
          // 如果交易对是BNB，需要乘以BNB的美元价格
          tokenPriceInUsd = tokenPrice * bnbPrice;
        }
        
        // 计算市值
        const marketCap = TOKEN_TOTAL_SUPPLY * tokenPriceInUsd;
        
        // 如果市值达到0.8M USD，发送POST请求
        if (marketCap >= 800000) {
          await sendMarketCapAlert(tokenAddress, tokenName, tokenSymbol, tokenPriceInUsd, marketCap);
        }

      }
    }
  } catch (error) {
    console.error('程序执行出错:', error);
  }
}

async function batchGetTokenName(publicClient, tokenAddresses) {
  const contractCalls = tokenAddresses.map(address => (
    getContract({
      address,
      abi: TOKEN_ABI,
      client: publicClient,
    }).read.name()
  ));
  
  return await Promise.all(contractCalls);
}

async function batchGetTokenSymbol(publicClient, tokenAddresses) {
    const contractCalls = tokenAddresses.map(address => (
    getContract({
      address,
      abi: TOKEN_ABI,
      client: publicClient,
    }).read.symbol()
  ));
  
  return await Promise.all(contractCalls);
}

/**
 * 批量获取交易对地址
 */
async function batchGetPairAddresses(publicClient, tokenAddresses, quotoTokens) {
  const factoryContract = getContract({
    address: PANCAKE_FACTORY,
    abi: FACTORY_ABI,
    client: publicClient,
  });

  const calls = [];
  for (let i = 0; i < tokenAddresses.length; i++) {
    calls.push(factoryContract.read.getPair([tokenAddresses[i], quotoTokens[i]]));
  }
  
  return await Promise.all(calls);
}

/**
 * 批量获取token0地址
 */
async function batchGetToken0(publicClient, pairAddresses) {
  const contractCalls = pairAddresses.map(address => (
    getContract({
      address,
      abi: PAIR_ABI,
      client: publicClient,
    }).read.token0()
  ));
  
  return await Promise.all(contractCalls);
}

/**
 * 批量获取交易对储备
 */
async function batchGetReserves(publicClient, pairAddresses) {
  const contractCalls = pairAddresses.map(address => (
    getContract({
      address,
      abi: PAIR_ABI,
      client: publicClient,
    }).read.getReserves()
  ));
  
  return await Promise.all(contractCalls);
}

/**
 * 获取BNB的美元价格
 */
async function getBnbPrice(publicClient) {
  const answer = await publicClient.readContract({
    address: BNB_USD_PRICE_FEED,
    abi: CHAINLINK_ABI,
    functionName: 'latestAnswer'
  });
  
  // Chainlink价格有8位小数
  return Number(answer) / 1e8;
}

/**
 * 发送市值提醒
 */
async function sendMarketCapAlert(tokenAddress, tokenName, tokenSymbol, tokenPrice, marketCap) {
  const redisUtil = getRedisUtil();
  
  try {
    // 检查是否在1小时内已经发送过通知
    const notificationKey = `market_cap_alert:${tokenAddress}`;
    const lastNotification = await redisUtil.client.get(notificationKey);
    
    if (lastNotification) {
      return;
    }
    
    // 格式化市值
    const formattedMarketCap = marketCap >= 1_000_000 
      ? (marketCap / 1_000_000).toFixed(2) + 'M' 
      : (marketCap / 1_000).toFixed(2) + 'K';

    const message = `Name : ${tokenName} \n` +
                    `Symbol : ${tokenSymbol} \n` +
                    `Address : ${tokenAddress} \n` +
                    `Price : ${tokenPrice} USD \n` +
                    `Market Cap : ${formattedMarketCap} USD`;
    
    await axios.post('http://43.167.207.101:3000/sendMessage', {
      message: message
    });
    
    // 发送成功后，设置Redis缓存，1小时过期
    await redisUtil.client.setex(notificationKey, 3600, Date.now().toString());
    
  } catch (error) {
    console.error('发送市值提醒失败:', error);
  }
} 