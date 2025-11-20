/**
 * 上传任务接口定义
 */
interface UploadTask {
  /** 任务唯一标识 */
  id: string;
  /** 执行上传的函数 */
  execute: () => Promise<any>;
  /** 解决Promise的函数 */
  resolve?: (value: any) => void;
  /** 拒绝Promise的函数 */
  reject?: (error: any) => void;
  /** 当前重试次数 */
  retryCount?: number;
  /** 最大重试次数 */
  maxRetries?: number;
}

/**
 * 上传队列配置选项
 */
interface UploadQueueOptions {
  /** 最大并发数 */
  maxConcurrency?: number;
  /** 请求间隔时间(毫秒) */
  requestInterval?: number;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 请求超时时间(毫秒) */
  requestTimeout?: number;
}

/**
 * 上传队列管理器
 *
 * 功能：
 * - 控制并发上传数量
 * - 实现QPS限制
 * - 智能重试机制
 * - 错误分类处理
 */
export class UploadQueue {
  private queue: UploadTask[] = [];
  private running = 0;
  private maxConcurrency: number;
  private requestInterval: number;
  private maxRetries: number;
  private requestTimeout: number;
  private lastRequestTime = 0;

  constructor(options: UploadQueueOptions = {}) {
    this.maxConcurrency = options.maxConcurrency || 3;//最大并发数
    this.requestInterval = options.requestInterval || 300; // 300ms间隔，约3.3 QPS
    this.maxRetries = options.maxRetries || 3;//最大重试次数
    this.requestTimeout = options.requestTimeout || 30000; // 30秒超时
  }

  /**
   * 添加上传任务到队列
   *
   * @param task 上传任务
   * @returns Promise，在任务完成时resolve或reject
   */
  async addTask(task: Omit<UploadTask, 'resolve' | 'reject' | 'retryCount'> & { maxRetries?: number }): Promise<any> {
    return new Promise((resolve, reject) => {
      const fullTask: UploadTask = {
        ...task,
        resolve,
        reject,
        retryCount: 0,
        maxRetries: task.maxRetries || this.maxRetries,
      };

      this.queue.push(fullTask);
      this.processQueue();
    });
  }

  /**
   * 处理队列中的任务
   */
  private async processQueue(): Promise<void> {
    // 检查是否可以开始新任务
    if (this.running >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    // 检查请求间隔
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.requestInterval) {
      const waitTime = this.requestInterval - timeSinceLastRequest;
      setTimeout(() => this.processQueue(), waitTime);
      return;
    }

    // 开始处理下一个任务
    this.running++;
    const task = this.queue.shift()!;
    this.lastRequestTime = Date.now();

    try {
      const result = await this.executeWithRetry(task);
      task.resolve?.(result);
    } catch (error) {
      task.reject?.(error);
    } finally {
      this.running--;
      // 继续处理队列中的下一个任务
      this.processQueue();
    }
  }

  /**
   * 执行任务并实现重试机制
   *
   * @param task 上传任务
   * @returns 执行结果
   */
  private async executeWithRetry(task: UploadTask): Promise<any> {
    try {
      // 添加超时控制
      const result = await Promise.race([
        task.execute(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), this.requestTimeout)
        )
      ]);
      return result;
    } catch (error: any) {
      const retryCount = task.retryCount || 0;

      // 判断是否应该重试
      if (this.shouldRetry(error) && retryCount < (task.maxRetries || this.maxRetries)) {
        task.retryCount = retryCount + 1;

        // 指数退避策略：2^retryCount * 1000ms
        const delay = Math.min(Math.pow(2, retryCount) * 1000, 10000); // 最大10秒

        console.warn(`上传任务 ${task.id} 第 ${retryCount + 1} 次重试，等待 ${delay}ms:`, error.message);

        await new Promise(resolve => setTimeout(resolve, delay));
        return this.executeWithRetry(task);
      }

      throw error;
    }
  }

  /**
   * 判断错误是否应该重试
   *
   * @param error 错误对象
   * @returns 是否应该重试
   */
  private shouldRetry(error: any): boolean {
    // 500错误通常可以重试（服务器内部错误）
    if (error.response?.status === 500) {
      return true;
    }

    // 502 Bad Gateway
    if (error.response?.status === 502) {
      return true;
    }

    // 503 Service Unavailable
    if (error.response?.status === 503) {
      return true;
    }

    // 504 Gateway Timeout
    if (error.response?.status === 504) {
      return true;
    }

    // 网络错误
    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNRESET') {
      return true;
    }

    // 超时错误
    if (error.code === 'ECONNABORTED' || error.message === 'Request timeout') {
      return true;
    }

    return false;
  }

  /**
   * 获取队列状态
   *
   * @returns 队列状态信息
   */
  getStatus(): {
    queueLength: number;
    running: number;
    maxConcurrency: number;
    requestInterval: number;
  } {
    return {
      queueLength: this.queue.length,
      running: this.running,
      maxConcurrency: this.maxConcurrency,
      requestInterval: this.requestInterval,
    };
  }

  /**
   * 清空队列
   */
  clear(): void {
    // 拒绝所有等待中的任务
    this.queue.forEach(task => {
      task.reject?.(new Error('Queue cleared'));
    });
    this.queue = [];
  }

  /**
   * 等待所有任务完成
   *
   * @returns Promise，在所有任务完成时resolve
   */
  async waitForCompletion(): Promise<void> {
    while (this.running > 0 || this.queue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

/**
 * 创建默认的上传队列实例
 */
export const defaultUploadQueue = new UploadQueue({
  maxConcurrency: 3,
  requestInterval: 150,
  maxRetries: 3,
  requestTimeout: 30000,
});