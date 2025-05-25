import Redis from 'ioredis';
import { readJson } from "./utils.js";

/**
 * Redis工具类
 * 提供常用的Redis操作封装
 */
class RedisUtil {

  constructor() {
    const config = readJson('config.json');
    this.config = {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    };

    this.client = null;
    this._init();
  }

  /**
   * 初始化Redis连接
   * @private
   */
  _init() {
    this.client = new Redis(this.config);
    
    this.client.on('connect', () => {
      console.log('Redis连接成功');
    });
    
    this.client.on('error', (err) => {
      console.error('Redis连接错误:', err);
    });
    
    this.client.on('close', () => {
      console.log('Redis连接已关闭');
    });
  }

  /**
   * 获取Redis客户端实例
   * @returns {Redis} Redis客户端实例
   */
  getClient() {
    return this.client;
  }

  /**
   * 关闭Redis连接
   */
  close() {
    if (this.client) {
      this.client.quit();
      this.client = null;
    }
  }

  /**
   * 等待Redis连接建立
   * @param {number} timeout - 超时时间(毫秒)
   * @returns {Promise<boolean>} 是否连接成功
   */
  async waitForConnection(timeout = 10000) {
    if (!this.client) {
      this._init();
    }
    
    // 如果已经连接，直接返回true
    if (this.client.status === 'ready') {
      return true;
    }
    
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve(false);
      }, timeout);
      
      const onReady = () => {
        clearTimeout(timer);
        this.client.off('ready', onReady);
        this.client.off('error', onError);
        resolve(true);
      };
      
      const onError = () => {
        clearTimeout(timer);
        this.client.off('ready', onReady);
        this.client.off('error', onError);
        resolve(false);
      };
      
      this.client.on('ready', onReady);
      this.client.on('error', onError);
    });
  }

  /**
   * 确保Redis连接可用
   * @returns {Promise<boolean>} 是否连接成功
   */
  async ensureConnection() {
    if (!this.client || this.client.status !== 'ready') {
      return await this.waitForConnection();
    }
    return true;
  }

  /**
   * 设置键值
   * @param {string} key - 键
   * @param {string|number|Object} value - 值
   * @param {number} [expireSeconds] - 过期时间(秒)
   * @returns {Promise<string>} 操作结果
   */
  async set(key, value, expireSeconds) {
    if (typeof value === 'object') {
      value = JSON.stringify(value);
    }
    
    if (expireSeconds) {
      return await this.client.set(key, value, 'EX', expireSeconds);
    } else {
      return await this.client.set(key, value);
    }
  }

  /**
   * 获取键值
   * @param {string} key - 键
   * @param {boolean} [parse=false] - 是否需要解析JSON
   * @returns {Promise<string|Object|null>} 值
   */
  async get(key, parse = false) {
    const value = await this.client.get(key);
    
    if (value && parse) {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
    
    return value;
  }

  /**
   * 删除键
   * @param {string|Array<string>} keys - 键或键数组
   * @returns {Promise<number>} 删除的键数量
   */
  async del(keys) {
    return await this.client.del(Array.isArray(keys) ? keys : [keys]);
  }

  /**
   * 检查键是否存在
   * @param {string} key - 键
   * @returns {Promise<number>} 1表示存在，0表示不存在
   */
  async exists(key) {
    return await this.client.exists(key);
  }

  /**
   * 设置键的过期时间
   * @param {string} key - 键
   * @param {number} seconds - 秒数
   * @returns {Promise<number>} 1表示成功，0表示键不存在
   */
  async expire(key, seconds) {
    return await this.client.expire(key, seconds);
  }

  /**
   * 获取键的剩余过期时间(秒)
   * @param {string} key - 键
   * @returns {Promise<number>} 剩余秒数，-1表示永不过期，-2表示键不存在
   */
  async ttl(key) {
    return await this.client.ttl(key);
  }

  // 哈希表操作 ----------------------------------------

  /**
   * 设置哈希表字段值
   * @param {string} key - 哈希表的键
   * @param {string} field - 字段名
   * @param {string|number|Object} value - 字段值
   * @returns {Promise<number>} 0表示更新，1表示新增
   */
  async hset(key, field, value) {
    if (typeof value === 'object') {
      value = JSON.stringify(value);
    }
    return await this.client.hset(key, field, value);
  }

  /**
   * 设置哈希表多个字段值
   * @param {string} key - 哈希表的键
   * @param {Object} fieldValues - 字段名和字段值的对象
   * @returns {Promise<string>} 操作结果
   */
  async hmset(key, fieldValues) {
    const processedValues = {};
    
    for (const [field, value] of Object.entries(fieldValues)) {
      processedValues[field] = typeof value === 'object' ? JSON.stringify(value) : value;
    }
    
    return await this.client.hmset(key, processedValues);
  }

  /**
   * 获取哈希表字段值
   * @param {string} key - 哈希表的键
   * @param {string} field - 字段名
   * @param {boolean} [parse=false] - 是否需要解析JSON
   * @returns {Promise<string|Object|null>} 字段值
   */
  async hget(key, field, parse = false) {
    const value = await this.client.hget(key, field);
    
    if (value && parse) {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
    
    return value;
  }

  /**
   * 获取哈希表多个字段值
   * @param {string} key - 哈希表的键
   * @param {Array<string>} fields - 字段名数组
   * @param {boolean} [parse=false] - 是否需要解析JSON
   * @returns {Promise<Array>} 字段值数组
   */
  async hmget(key, fields, parse = false) {
    const values = await this.client.hmget(key, fields);
    
    if (parse) {
      return values.map(value => {
        if (value) {
          try {
            return JSON.parse(value);
          } catch (e) {
            return value;
          }
        }
        return value;
      });
    }
    
    return values;
  }

  /**
   * 获取哈希表所有字段和值
   * @param {string} key - 哈希表的键
   * @param {boolean} [parse=false] - 是否需要解析JSON
   * @returns {Promise<Object>} 字段和值的对象
   */
  async hgetall(key, parse = false) {
    const obj = await this.client.hgetall(key);
    
    if (obj && parse) {
      const result = {};
      for (const [field, value] of Object.entries(obj)) {
        try {
          result[field] = JSON.parse(value);
        } catch (e) {
          result[field] = value;
        }
      }
      return result;
    }
    
    return obj || {};
  }

  /**
   * 删除哈希表字段
   * @param {string} key - 哈希表的键
   * @param {string|Array<string>} fields - 字段名或字段名数组
   * @returns {Promise<number>} 删除的字段数量
   */
  async hdel(key, fields) {
    return await this.client.hdel(key, Array.isArray(fields) ? fields : [fields]);
  }

  // 列表操作 ----------------------------------------
  
  /**
   * 将值插入列表头部
   * @param {string} key - 列表的键
   * @param {string|number|Object|Array<string|number|Object>} values - 值或值数组
   * @returns {Promise<number>} 操作后列表的长度
   */
  async lpush(key, values) {
    const items = Array.isArray(values) ? values : [values];
    const processedItems = items.map(item => 
      typeof item === 'object' ? JSON.stringify(item) : item
    );
    
    return await this.client.lpush(key, ...processedItems);
  }

  /**
   * 将值插入列表尾部
   * @param {string} key - 列表的键
   * @param {string|number|Object|Array<string|number|Object>} values - 值或值数组
   * @returns {Promise<number>} 操作后列表的长度
   */
  async rpush(key, values) {
    const items = Array.isArray(values) ? values : [values];
    const processedItems = items.map(item => 
      typeof item === 'object' ? JSON.stringify(item) : item
    );
    
    return await this.client.rpush(key, ...processedItems);
  }

  /**
   * 获取列表指定范围的元素
   * @param {string} key - 列表的键
   * @param {number} start - 开始索引
   * @param {number} stop - 结束索引
   * @param {boolean} [parse=false] - 是否需要解析JSON
   * @returns {Promise<Array>} 列表元素数组
   */
  async lrange(key, start, stop, parse = false) {
    const items = await this.client.lrange(key, start, stop);
    
    if (parse) {
      return items.map(item => {
        try {
          return JSON.parse(item);
        } catch (e) {
          return item;
        }
      });
    }
    
    return items;
  }

  /**
   * 获取列表长度
   * @param {string} key - 列表的键
   * @returns {Promise<number>} 列表长度
   */
  async llen(key) {
    return await this.client.llen(key);
  }

  // 集合操作 ----------------------------------------

  /**
   * 添加集合成员
   * @param {string} key - 集合的键
   * @param {string|number|Object|Array<string|number|Object>} members - 成员或成员数组
   * @returns {Promise<number>} 添加的成员数量
   */
  async sadd(key, members) {
    const items = Array.isArray(members) ? members : [members];
    const processedItems = items.map(item => 
      typeof item === 'object' ? JSON.stringify(item) : item
    );
    
    return await this.client.sadd(key, ...processedItems);
  }

  /**
   * 获取集合所有成员
   * @param {string} key - 集合的键
   * @param {boolean} [parse=false] - 是否需要解析JSON
   * @returns {Promise<Array>} 成员数组
   */
  async smembers(key, parse = false) {
    const members = await this.client.smembers(key);
    
    if (parse) {
      return members.map(member => {
        try {
          return JSON.parse(member);
        } catch (e) {
          return member;
        }
      });
    }
    
    return members;
  }

  /**
   * 检查集合中是否存在成员
   * @param {string} key - 集合的键
   * @param {string|number|Object} member - 成员
   * @returns {Promise<number>} 1表示存在，0表示不存在
   */
  async sismember(key, member) {
    if (typeof member === 'object') {
      member = JSON.stringify(member);
    }
    
    return await this.client.sismember(key, member);
  }

  /**
   * 获取集合成员数量
   * @param {string} key - 集合的键
   * @returns {Promise<number>} 成员数量
   */
  async scard(key) {
    return await this.client.scard(key);
  }

  /**
   * 移除集合成员
   * @param {string} key - 集合的键
   * @param {string|number|Object|Array<string|number|Object>} members - 成员或成员数组
   * @returns {Promise<number>} 移除的成员数量
   */
  async srem(key, members) {
    const items = Array.isArray(members) ? members : [members];
    const processedItems = items.map(item => 
      typeof item === 'object' ? JSON.stringify(item) : item
    );
    
    return await this.client.srem(key, ...processedItems);
  }

  // 事务操作 ----------------------------------------

  /**
   * 执行事务操作
   * @param {Function} transactionFn - 事务函数，接收multi对象作为参数
   * @returns {Promise<Array>} 事务执行结果
   */
  async transaction(transactionFn) {
    const multi = this.client.multi();
    transactionFn(multi);
    return await multi.exec();
  }

  /**
   * 创建锁
   * @param {string} lockKey - 锁的键名
   * @param {number} ttl - 锁的过期时间(秒)
   * @param {number} [retryTimes=5] - 重试次数
   * @param {number} [retryDelay=200] - 重试延迟(毫秒)
   * @returns {Promise<string|null>} 锁的值，null表示获取锁失败
   */
  async acquireLock(lockKey, ttl, retryTimes = 5, retryDelay = 200) {
    const lockValue = Date.now().toString();
    let retry = 0;
    
    while (retry < retryTimes) {
      const result = await this.client.set(lockKey, lockValue, 'NX', 'EX', ttl);
      
      if (result === 'OK') {
        return lockValue;
      }
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      retry++;
    }
    
    return null;
  }

  /**
   * 释放锁
   * @param {string} lockKey - 锁的键名
   * @param {string} lockValue - 锁的值
   * @returns {Promise<boolean>} 是否成功释放锁
   */
  async releaseLock(lockKey, lockValue) {
    const script = `
      if redis.call('get', KEYS[1]) == ARGV[1] then
        return redis.call('del', KEYS[1])
      else
        return 0
      end
    `;
    
    const result = await this.client.eval(script, 1, lockKey, lockValue);
    return result === 1;
  }
}

// 单例模式导出实例
let instance = null;

/**
 * 获取RedisUtil实例
 * @returns {RedisUtil} Redis工具类实例
 */
export const getRedisUtil = () => {
  if (!instance) {
    instance = new RedisUtil();
  }
  return instance;
};

export default RedisUtil; 