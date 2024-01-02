import { RedisClientType } from 'redis';

interface Options {
  maxAge?: number;
  lockTimeout?: number;
  retry?: boolean;
  retryPeroid?: number;
}

export function createTimeout<T>(promise: T, millSecond: number): Promise<Awaited<T>> {
  return Promise.race([
    promise,
    new Promise((resolve, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT")), millSecond)
    ),
  ]) as Promise<Awaited<T>>;
}
export const delay = (millSecond: number) =>
  new Promise((resolve) => setTimeout(resolve, millSecond));

export class RedisLock {
  redis: RedisClientType;
  redisKey: string;
  options: Required<Options>;
  lastRequestTime?: number;

  constructor(redis, key: string, options: Options = {}) {
    this.redis = redis;
    this.redisKey = `b_${key}`;
    this.options = Object.assign(
      { maxAge: 10000, lockTimeout: 5000, retry: false, retryPeroid: 500 },
      options
    );
  }

  _lock = async () => {
    try {
      const { maxAge } = this.options;
      const lockRes = await createTimeout(
        this.redis.set(this.redisKey, 1, {
          PX: maxAge,
          NX: true,
        }),
        this.options.lockTimeout
      );
      if (lockRes !== null) {
        return { result: true };
      }
      return { result: false, code: "LOCKED" };
    } catch (e) {
      console.error(e);
      if (e?.message === "TIMEOUT") {
        return {
          result: false,
          code: "TIMEOUT",
        };
      }
      return {
        result: false,
        code: "UNKNOWN",
      };
    }
  };

  lock = async () => {
    const { retry, retryPeroid, lockTimeout } = this.options;
    if (!retry) {
      return this._lock();
    }
    this.lastRequestTime = Date.now();
    while (true) {
      const res = await this._lock();
      if (res.code !== "LOCKED") {
        return res;
      }

      const leftTime = lockTimeout - (Date.now() - this.lastRequestTime);
      if (leftTime <= 0) {
        return {
          result: false,
          code: "TIMEOUT",
        };
      }
      await delay(retryPeroid);
    }
  };

  lockTransaction = async <T>(callback: () => Promise<T>): Promise<T> => {
    await this.lock();
    try {
      return await callback();
    } finally {
      await this.unlock();
    }
  }

  unlock = () => {
    return this.redis.del(this.redisKey);
  };
}
