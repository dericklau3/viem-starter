import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import path from 'path';
import { createDir, writeJson, readJson, readDirJson } from './utils.js';
import dotenv from 'dotenv';
dotenv.config();

// 密钥库存储目录
const KEYSTORE_DIR = path.resolve(process.cwd(), 'keystores');

// 确保密钥库目录存在
createDir(KEYSTORE_DIR);

/**
 * 生成新的账户
 * @param {string} password - 用于加密私钥的密码
 * @returns {Object} - 返回账户信息，包括地址和加密后的私钥信息
 */
export function generateAccount(password) {
    // 生成私钥
    const privateKey = generatePrivateKey();
    
    // 使用私钥创建账户
    const account = privateKeyToAccount(privateKey);
    
    // 加密私钥
    const encryptedPrivateKey = encryptPrivateKey(privateKey, password);
    
    // 创建密钥库文件
    const keystore = {
        address: account.address,
        crypto: encryptedPrivateKey,
        id: account.address.substring(2, 10),
        version: 1
    };
    
    // 存储到文件
    const keystorePath = path.join(KEYSTORE_DIR, `${account.address}.json`);
    writeJson(keystorePath, keystore);
    
    return {
        address: account.address,
        keystorePath
    };
}

/**
 * 批量生成多个账户
 * @param {number} count - 要生成的账户数量
 * @param {string} password - 用于加密私钥的密码
 * @returns {Array<Object>} - 返回账户信息数组，每个包含地址和加密后的私钥信息
 */
export function generateAccounts(count, password) {
    const accounts = [];
    
    for (let i = 0; i < count; i++) {
        const account = generateAccount(password);
        accounts.push(account);
    }
    
    return accounts;
}

/**
 * 加密私钥
 * @param {string} privateKey - 私钥
 * @param {string} password - 密码
 * @returns {Object} - 加密信息
 */
function encryptPrivateKey(privateKey, password) {
    // 生成随机盐和IV
    const salt = randomBytes(32);
    const iv = randomBytes(16);
    
    // 使用密码和盐创建密钥
    const key = Buffer.from(password + salt.toString('hex'));
    
    // 创建加密器
    const cipher = createCipheriv('aes-256-cbc', key.slice(0, 32), iv);
    
    // 加密私钥
    let encrypted = cipher.update(privateKey.slice(2), 'hex', 'hex');
    encrypted += cipher.final('hex');
    
    return {
        ciphertext: encrypted,
        cipherparams: {
            iv: iv.toString('hex')
        },
        cipher: 'aes-256-cbc',
        kdf: 'scrypt',
        kdfparams: {
            salt: salt.toString('hex'),
            n: 8192,
            r: 8,
            p: 1,
            dklen: 32
        }
    };
}

/**
 * 获取所有账户地址
 * @returns {Array} - 所有账户地址列表
 */
export function getAllAccounts() {
    try {
        const jsonFiles = readDirJson(KEYSTORE_DIR);
        return jsonFiles.map(file => {
            const keystorePath = path.join(KEYSTORE_DIR, file);
            const keystore = readJson(keystorePath);
            return keystore.address;
        });
    } catch (error) {
        console.error('获取账户列表失败:', error);
        return [];
    }
}

/**
 * 解密私钥
 * @param {string} address - 账户地址
 * @param {string} password - 密码
 * @returns {string|null} - 解密后的私钥或null（如果解密失败）
 */
export function decryptPrivateKey(address, password) {
    try {
        const keystorePath = path.join(KEYSTORE_DIR, `${address}.json`);
        const keystore = readJson(keystorePath);
        
        const { crypto } = keystore;
        const { ciphertext, cipherparams, kdfparams } = crypto;
        
        // 使用密码和盐重新创建密钥
        const salt = Buffer.from(kdfparams.salt, 'hex');
        const key = Buffer.from(password + salt.toString('hex'));
        
        // 创建解密器
        const iv = Buffer.from(cipherparams.iv, 'hex');
        const decipher = createDecipheriv('aes-256-cbc', key.slice(0, 32), iv);
        
        // 解密私钥
        let decrypted = decipher.update(ciphertext, 'hex', 'hex');
        decrypted += decipher.final('hex');
        
        return `0x${decrypted}`;
    } catch (error) {
        console.error('解密私钥失败:', error);
        return null;
    }
}

/**
 * 根据地址从keystores目录获取账户对象
 * @param {string} address - 账户地址
 * @param {string} password - 用于解密私钥的密码
 * @returns {Object|null} - viem账户对象或null（如果找不到账户或解密失败）
 */
export function getAccountFromKeystores(address, password) {
    try {
        // 获取私钥
        const privateKey = decryptPrivateKey(address, password);
        
        if (!privateKey) {
            console.error('无法解密私钥或找不到账户文件');
            return null;
        }
        
        // 将私钥转换为账户对象
        return privateKeyToAccount(privateKey);
    } catch (error) {
        console.error('从keystores获取账户失败:', error);
        return null;
    }
}

export function getLocalAccount() {
    return privateKeyToAccount(process.env.PRIVATEKEY);
}
