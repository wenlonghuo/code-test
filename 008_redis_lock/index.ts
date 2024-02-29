import { RedisClientType } from "redis";

interface Options {
  maxAge?: number;
  lockTimeout?: number;
  retry?: boolean;
  retryPeriod?: number;
}

export function createTimeout<T>(
  promise: T,
  millSecond: number
): Promise<Awaited<T>> {
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
  lockVal: string;

  constructor(redis, key: string, options: Options = {}) {
    this.redis = redis;
    this.redisKey = `b_${key}`;
    this.options = Object.assign(
      { maxAge: 10000, lockTimeout: 5000, retry: false, retryPeriod: 500 },
      options
    );
    this.lockVal = Math.random().toString().slice(-10)
  }

  _lock = async () => {
    try {
      const { maxAge } = this.options;
      const lockRes = await createTimeout(
        this.redis.set(this.redisKey, this.lockVal, {
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
    const { retry, retryPeriod, lockTimeout } = this.options;
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
      await delay(retryPeriod);
    }
  };

  lockTransaction = async <T>(callback: () => Promise<T>): Promise<T> => {
    const res = await this.lock();
    if (!res.result) {
      throw new Error("Lock Failed");
    }
    try {
      return await callback();
    } finally {
      await this.unlock();
    }
  };

  // unlock should check locking value is current value. if not, do not delete.
  unlock = async () => {
    try {
      const { lockTimeout, maxAge } = this.options;
      const res = await createTimeout(
        this.redis.expire(this.redisKey, Math.round(maxAge / 1000)),
        lockTimeout
      );

      if (!res) {
        return true;
      }
      const val = await createTimeout(
        this.redis.get(this.redisKey),
        lockTimeout
      );

      if (val !== this.lockVal) {
        return true;
      }
      return this.redis.del(this.redisKey)
    } catch(e) {
      console.error(e)
      return false;
    }
  };
}
