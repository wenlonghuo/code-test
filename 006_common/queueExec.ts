export default async function queueExecAsyncFunc (func: any, list: any[], { maxLen = 10 }) {
  const queueList: any[] = [];
  const resultList: any[] = [];
  const loopLen = Math.min(list.length, maxLen);
  let execIndex = -1;

  return new Promise((resolve, reject) => {
    for (let i = 0; i < loopLen; i++) {
      addNewItem(i);
    }
    function checkAllReady () {
      return execIndex >= list.length && queueList.every(item => !item);
    }

    function exec (index: number) {
      if (index >= list.length) {
        reject(new Error('queue max'));
        return Promise.reject(new Error('error'));
      }
      const args = list[index];
      return Promise.resolve()
        .then(() => {
          return func.apply(undefined, args);
        })
        .then((result) => {
          resultList[index] = result;
        })
        .catch(reject);
    }

    function addNewItem (index: number) {
      execIndex++;
      if (execIndex >= list.length) {
        return;
      }
      queueList[index] = exec(execIndex).then(() => {
        queueList[index] = undefined;
        if (execIndex < list.length) {
          addNewItem(index);
        }
        if (checkAllReady()) {
          resolve(resultList);
        }
      });
    }
  });
}
