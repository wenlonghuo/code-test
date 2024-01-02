const { delay, createTimeout, RedisLock } = require("../index");
const { client } = require("../client");

test("lock parallel", async () => {
  const testClient = new RedisLock(client, "test1", {
    maxAge: 3000,
    lockTimeout: 4000,
    retryPeriod: 100,
  });
  const lock1 = testClient.lock();
  const lock2 = testClient.lock();
  expect(await lock1).toEqual({ result: true });
  expect(await lock2).toEqual({ result: false, code: "LOCKED" });
});
test("lock after expire", async () => {
  const testClient1 = new RedisLock(client, "test2", {
    maxAge: 1000,
    lockTimeout: 4000,
    retryPeriod: 100,
  });
  expect(await testClient1.lock()).toEqual({ result: true });
  await delay(1000);
  const testClient2 = new RedisLock(client, "test2", {
    maxAge: 1000,
    lockTimeout: 4000,
    retryPeriod: 100,
  });
  expect(await testClient2.lock()).toEqual({ result: true });
});

test("lock after delete", async () => {
  const key = "test3";
  const testClient1 = new RedisLock(client, key, {
    maxAge: 1000,
    lockTimeout: 4000,
    retryPeriod: 100,
  });
  expect(await testClient1.lock()).toEqual({ result: true });
  await testClient1.unlock();
  const testClient2 = new RedisLock(client, key, {
    maxAge: 1000,
    lockTimeout: 4000,
    retryPeriod: 100,
  });
  expect(await testClient2.lock()).toEqual({ result: true });
});

test("lock with retry", async () => {
  const key = "test4";
  const testClient1 = new RedisLock(client, key, {
    maxAge: 1000,
    lockTimeout: 4000,
  });
  const lock1 = testClient1.lock();

  const testClient2 = new RedisLock(client, key, {
    maxAge: 1000,
    lockTimeout: 4000,
    retryPeriod: 200,
    retry: true,
  });
  const lock2 = testClient2.lock();
  expect(await lock1).toEqual({ result: true });
  expect(await lock2).toEqual({ result: true });
});

test("lock with retry timeout", async () => {
  const key = "test5";
  const testClient1 = new RedisLock(client, key, {
    maxAge: 4000,
    lockTimeout: 4000,
  });
  const lock1 = testClient1.lock();

  const testClient2 = new RedisLock(client, key, {
    maxAge: 1000,
    lockTimeout: 1000,
    retryPeriod: 200,
    retry: true,
  });
  const lock2 = testClient2.lock();
  expect(await lock1).toEqual({ result: true });
  expect(await lock2).toEqual({ result: false, code: "TIMEOUT" });
});

test("create timeout", async () => {
  await expect(
    createTimeout(new Promise((resolve) => {}), 1000)
  ).rejects.toThrow("TIMEOUT");
});
