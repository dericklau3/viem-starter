import { getRedisUtil } from '../common/redisUtil.js';

// 获取RedisUtil单例
const redisUtil = getRedisUtil();

/**
 * 演示RedisUtil的基本用法
 */
async function main() {
  try {
    console.log('开始Redis工具类演示...');
    
    // 基本键值操作
    await redisUtil.set('demo:string', '这是一个字符串值');
    console.log('设置字符串值成功');
    
    const stringValue = await redisUtil.get('demo:string');
    console.log('获取字符串值:', stringValue);
    
    // 设置JSON对象
    const user = {
      id: 1001,
      name: '张三',
      age: 28,
      roles: ['admin', 'editor'],
      active: true
    };
    
    await redisUtil.set('demo:user', user);
    console.log('设置JSON对象成功');
    
    // 获取并解析JSON对象
    const savedUser = await redisUtil.get('demo:user', true);
    console.log('获取JSON对象:', savedUser);
    
    // 设置带过期时间的键值
    await redisUtil.set('demo:expireKey', '10秒后过期', 10);
    console.log('设置带过期时间的键值成功（10秒）');
    
    const ttl = await redisUtil.ttl('demo:expireKey');
    console.log(`键的剩余过期时间: ${ttl}秒`);
    
    // 哈希表操作
    await redisUtil.hset('demo:hash', 'field1', '值1');
    await redisUtil.hset('demo:hash', 'field2', '值2');
    await redisUtil.hset('demo:hash', 'field3', { nested: true, data: [1, 2, 3] });
    console.log('设置哈希表字段成功');
    
    const hashValues = await redisUtil.hgetall('demo:hash', true);
    console.log('获取哈希表所有字段和值:', hashValues);
    
    // 列表操作
    await redisUtil.lpush('demo:list', ['第一项', '第二项', '第三项']);
    console.log('插入列表项成功');
    
    const listItems = await redisUtil.lrange('demo:list', 0, -1);
    console.log('获取列表所有项:', listItems);
    
    // 集合操作
    await redisUtil.sadd('demo:set', ['苹果', '香蕉', '橙子', '苹果']);
    console.log('添加集合成员成功');
    
    const setMembers = await redisUtil.smembers('demo:set');
    console.log('获取集合所有成员:', setMembers);
    
    // 对象与JSON的自动转换
    const complexObject = {
      id: 'obj123',
      data: {
        items: [
          { name: '商品1', price: 99.8 },
          { name: '商品2', price: 199.5 }
        ],
        count: 2,
        timestamp: Date.now()
      }
    };
    
    await redisUtil.set('demo:complex', complexObject);
    const retrievedObject = await redisUtil.get('demo:complex', true);
    console.log('复杂对象自动转换示例:', retrievedObject);
    
    // 分布式锁示例
    console.log('尝试获取分布式锁...');
    const lockValue = await redisUtil.acquireLock('demo:lock', 30);
    
    if (lockValue) {
      console.log('获取锁成功，执行受保护的操作');
      
      // 模拟一些受锁保护的操作
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 释放锁
      const released = await redisUtil.releaseLock('demo:lock', lockValue);
      console.log('锁释放' + (released ? '成功' : '失败'));
    } else {
      console.log('获取锁失败');
    }
    
    // 清理示例键
    await redisUtil.del([
      'demo:string', 
      'demo:user', 
      'demo:expireKey', 
      'demo:hash', 
      'demo:list', 
      'demo:set', 
      'demo:complex',
      'demo:lock'
    ]);
    console.log('清理完成');
    
  } catch (error) {
    console.error('Redis操作出错:', error);
  } finally {
    // 关闭Redis连接
    redisUtil.close();
    console.log('Redis连接已关闭');
  }
}

// 运行演示
main(); 