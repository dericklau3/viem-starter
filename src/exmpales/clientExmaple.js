import { getPublicClient, getWalletClient, supportEIP1559 } from '../common/client.js';

// node src/exmpales/clientExmaple.js
async function main() {
  console.log("第一次调用 getPublicClient('mainnet')");
  const client1 = getPublicClient('mainnet');
  
  console.log("第二次调用 getPublicClient('mainnet')");
  const client2 = getPublicClient('mainnet');
  
  // 检查两次调用是否返回相同实例
  console.log("检查是否为同一个实例:", client1 === client2);
  
  console.log("第一次调用 getWalletClient('mainnet')");
  const walletClient1 = getWalletClient('mainnet');
  
  console.log("第二次调用 getWalletClient('mainnet')");
  const walletClient2 = getWalletClient('mainnet');
  
  // 检查两次调用是否返回相同实例
  console.log("检查是否为同一个实例:", walletClient1 === walletClient2);
  
  // 检查不同网络的客户端是否是不同实例
  console.log("不同网络测试:");
  const sepoliaClient = getPublicClient('sepolia');
  console.log("测试是否为不同实例:", client1 === sepoliaClient);

  console.log("支持EIP-1559:", supportEIP1559(client1));
  console.log("支持EIP-1559:", supportEIP1559(getPublicClient('bsctest')));
}

main();
