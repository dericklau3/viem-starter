import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { format } from 'date-fns';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 日志文件根目录
const LOG_DIR = path.join(__dirname, '../../logs');

// 确保日志目录存在
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * 日志级别
 */
const LogLevel = {
  INFO: 'INFO',
  ERROR: 'ERROR',
  WARN: 'WARN',
  DEBUG: 'DEBUG'
};

/**
 * 基本日志写入函数，不依赖类实例，用于内部系统日志
 * @param {string} message 日志消息
 */
const internalLog = (message) => {
  try {
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS');
    const logMessage = `[${timestamp}] [SYSTEM] ${message}\n`;
    const systemLogFile = path.join(LOG_DIR, 'system.log');
    fs.appendFileSync(systemLogFile, logMessage);
  } catch (error) {
    console.error('内部日志写入失败:', error);
  }
};

/**
 * 清理7天前的日志文件
 */
const cleanOldLogs = () => {
  try {
    const files = fs.readdirSync(LOG_DIR);
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    files.forEach(file => {
      if (file.endsWith('.log') && file !== 'system.log') {
        const fileDateMatch = file.match(/^(\d{4}-\d{2}-\d{2})\.log$/);
        if (fileDateMatch) {
          const fileDate = new Date(fileDateMatch[1]);
          if (fileDate < sevenDaysAgo) {
            fs.unlinkSync(path.join(LOG_DIR, file));
            internalLog(`已删除过期日志文件: ${file}`);
          }
        }
      }
    });
  } catch (error) {
    internalLog(`清理旧日志文件失败: ${error.message}`);
  }
};

// 启动时先清理一次旧日志
cleanOldLogs();

/**
 * 日志工具类
 */
class Logger {
  constructor(moduleName = 'app') {
    this.moduleName = moduleName;
  }

  /**
   * 获取当前日期作为日志文件名
   * @returns {string} 日志文件名
   */
  getLogFileName() {
    const today = format(new Date(), 'yyyy-MM-dd');
    return path.join(LOG_DIR, `${today}.log`);
  }

  /**
   * 格式化日志消息
   * @param {string} level 日志级别
   * @param {string} message 日志消息
   * @param {Object} data 额外数据
   * @returns {string} 格式化后的日志消息
   */
  formatLogMessage(level, message, data) {
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS');
    const formattedData = data ? JSON.stringify(data) : '';
    return `[${timestamp}] [${level}] [${this.moduleName}] ${message} ${formattedData}\n`;
  }

  /**
   * 写入日志到文件
   * @param {string} level 日志级别
   * @param {string} message 日志消息
   * @param {Object} data 额外数据
   */
  writeLog(level, message, data) {
    try {
      const logMessage = this.formatLogMessage(level, message, data);
      fs.appendFileSync(this.getLogFileName(), logMessage);
    } catch (error) {
      console.error('写入日志失败:', error);
    }
  }

  /**
   * 信息日志
   * @param {string} message 日志消息
   * @param {Object} data 额外数据
   */
  info(message, data) {
    this.writeLog(LogLevel.INFO, message, data);
  }

  /**
   * 错误日志
   * @param {string} message 日志消息
   * @param {Object} data 额外数据
   */
  error(message, data) {
    this.writeLog(LogLevel.ERROR, message, data);
  }

  /**
   * 警告日志
   * @param {string} message 日志消息
   * @param {Object} data 额外数据
   */
  warn(message, data) {
    this.writeLog(LogLevel.WARN, message, data);
  }

  /**
   * 调试日志
   * @param {string} message 日志消息
   * @param {Object} data 额外数据
   */
  debug(message, data) {
    this.writeLog(LogLevel.DEBUG, message, data);
  }
}

/**
 * 设置定时任务，每天清理一次过期日志
 */
setInterval(cleanOldLogs, 24 * 60 * 60 * 1000);

/**
 * 获取日志工具实例
 * @param {string} moduleName 模块名称
 * @returns {Logger} 日志工具实例
 */
export const getLogger = (moduleName) => {
  return new Logger(moduleName);
};

export default Logger; 