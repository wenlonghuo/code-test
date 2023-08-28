import { diffJson, OLD_VALUE_KEY, NEW_VALUE_KEY } from './json-diff';

test('different type return directly', () => {
  const beforeValue = {};
  const afterValue = [];
  expect(diffJson(beforeValue, afterValue, {})).toEqual({ [OLD_VALUE_KEY]: beforeValue, [NEW_VALUE_KEY]: afterValue });
});

describe('primitive array', () => {
  test('simple delete', () => {
    const beforeValue = [1, 'str', true];
    const afterValue = [1, true];
    const afterValue2 = ['str', true];
    const afterValue3 = [1, 'str'];
    expect(diffJson(beforeValue, afterValue, {})).toEqual([1, { [OLD_VALUE_KEY]: 'str' }, true]);
    expect(diffJson(beforeValue, afterValue2, {})).toEqual([{ [OLD_VALUE_KEY]: 1 }, 'str', true]);
    expect(diffJson(beforeValue, afterValue3, {})).toEqual([1, 'str', { [OLD_VALUE_KEY]: true }]);
  });

  test('simple add', () => {
    const beforeValue = [1, 'str', true];
    const afterValue = [2, 1, 'str', true];
    const afterValue2 = [1, 2, 'str', true];
    const afterValue3 = [1, 'str', true, 2];
    expect(diffJson(beforeValue, afterValue, {})).toEqual([{ [NEW_VALUE_KEY]: 2 }, 1, 'str', true]);
    expect(diffJson(beforeValue, afterValue2, {})).toEqual([1, { [NEW_VALUE_KEY]: 2 }, 'str', true]);
    expect(diffJson(beforeValue, afterValue3, {})).toEqual([1, 'str', true, { [NEW_VALUE_KEY]: 2 }]);
  });

  test('modify', () => {
    const beforeValue = [1, 'str', true];
    const afterValue = [1, false, true];
    expect(diffJson(beforeValue, afterValue, {})).toEqual([
      1,
      { [OLD_VALUE_KEY]: 'str', [NEW_VALUE_KEY]: false },
      true,
    ]);
  });

  test('sequently modify and add will be delete and add', () => {
    const beforeValue = [1, 'str', true];
    const afterValue = [1, false, 'test', true];
    expect(diffJson(beforeValue, afterValue, {})).toEqual([
      1,
      { [OLD_VALUE_KEY]: 'str' },
      { [NEW_VALUE_KEY]: false },
      { [NEW_VALUE_KEY]: 'test' },
      true,
    ]);
  });
});

describe('primitive object', () => {
  test('delete key', () => {
    const beforeValue = { a: 1 };
    const afterValue = {};
    expect(diffJson(beforeValue, afterValue, {})).toEqual({ a: { [OLD_VALUE_KEY]: 1 } });
  });

  test('add key', () => {
    const beforeValue = { a: 1 };
    const afterValue = { a: 1, b: 3 };
    expect(diffJson(beforeValue, afterValue, {})).toEqual({ a: 1, b: { [NEW_VALUE_KEY]: 3 } });
  });

  test('modify key', () => {
    const beforeValue = { a: 1 };
    const afterValue = { a: 2 };
    expect(diffJson(beforeValue, afterValue, {})).toEqual({ a: { [OLD_VALUE_KEY]: 1, [NEW_VALUE_KEY]: 2 } });
  });
});

describe('object array', () => {
  interface ArrayItem {
    a: number;
  }
  test('delete key', () => {
    const beforeValue = [{ a: 1 }];
    const afterValue = [];
    expect(
      diffJson<ArrayItem>(beforeValue, afterValue, {
        objectEq: (prefix, beforeValue, afterValue) => beforeValue.a === afterValue.a,
      }),
    ).toEqual([{ [OLD_VALUE_KEY]: { a: 1 } }]);
  });

  test('add key', () => {
    const beforeValue = [];
    const afterValue = [{ a: 1 }];
    expect(
      diffJson<ArrayItem>(beforeValue, afterValue, {
        objectEq: (prefix, beforeValue, afterValue) => beforeValue.a === afterValue.a,
      }),
    ).toEqual([{ [NEW_VALUE_KEY]: { a: 1 } }]);
  });

  test('modify key', () => {
    const beforeValue = [{ a: 2 }, { a: 2 }];
    const afterValue = [{ a: 1 }, { a: 2 }];
    expect(
      diffJson<ArrayItem>(beforeValue, afterValue, {
        objectEq: (prefix, beforeValue, afterValue) => beforeValue.a === afterValue.a,
      }),
    ).toEqual([{ a: { [OLD_VALUE_KEY]: 2, [NEW_VALUE_KEY]: 1 } }, { a: 2 }]);
  });
});

describe('deep object array', () => {
  test('delete key', () => {
    const beforeValue = [{ a: 1, children: [{ a: 3 }] }];
    const afterValue = [{ a: 1, children: [] }];
    expect(
      diffJson<any>(beforeValue, afterValue, {
        objectEq: (prefix, beforeValue, afterValue) => beforeValue.a === afterValue.a,
      }),
    ).toEqual([{ a: 1, children: [{ [OLD_VALUE_KEY]: { a: 3 } }] }]);
  });

  test('add key', () => {
    const beforeValue = [{ a: 1, children: [] }];
    const afterValue = [{ a: 1, children: [{ a: 3 }] }];
    expect(
      diffJson<any>(beforeValue, afterValue, {
        objectEq: (prefix, beforeValue, afterValue) => beforeValue.a === afterValue.a,
      }),
    ).toEqual([{ a: 1, children: [{ [NEW_VALUE_KEY]: { a: 3 } }] }]);
  });

  test('modify key', () => {
    const beforeValue = [{ a: 1, children: [{ a: 2 }] }];
    const afterValue = [{ a: 1, children: [{ a: 3 }] }];
    expect(
      diffJson<any>(beforeValue, afterValue, {
        objectEq: (prefix, beforeValue, afterValue) => beforeValue.a === afterValue.a,
      }),
    ).toEqual([{ a: 1, children: [{ a: { [NEW_VALUE_KEY]: 3, [OLD_VALUE_KEY]: 2 } }] }]);
  });

  test('modify key other', () => {
    const beforeValue = [{ a: 1, children: [{ a: 3, b: 2 }] }];
    const afterValue = [{ a: 1, children: [{ a: 3, b: 1 }] }];
    expect(
      diffJson<any>(beforeValue, afterValue, {
        objectEq: (prefix, beforeValue, afterValue) => beforeValue.a === afterValue.a,
      }),
    ).toEqual([{ a: 1, children: [{ a: 3, b: { [NEW_VALUE_KEY]: 1, [OLD_VALUE_KEY]: 2 } }] }]);
  });
});

describe('deep object array: option arrayPatchToLeaf', () => {
  test('delete key', () => {
    const beforeValue = [{ a: 1, children: [{ a: 3 }] }];
    const afterValue = [{ a: 1, children: [] }];
    expect(
      diffJson<any>(beforeValue, afterValue, {
        objectEq: (prefix, beforeValue, afterValue) => beforeValue.a === afterValue.a,
        arrayPatchToLeaf: true,
      }),
    ).toEqual([{ a: 1, children: [{ a: { [OLD_VALUE_KEY]: 3 } }] }]);
  });

  test('add key', () => {
    const beforeValue = [{ a: 1, children: [] }];
    const afterValue = [{ a: 1, children: [{ a: 3 }] }];
    expect(
      diffJson<any>(beforeValue, afterValue, {
        objectEq: (prefix, beforeValue, afterValue) => beforeValue.a === afterValue.a,
        arrayPatchToLeaf: true,
      }),
    ).toEqual([{ a: 1, children: [{ a: { [NEW_VALUE_KEY]: 3 } }] }]);
  });
});

describe('deep object array: option partialArrayKey', () => {
  test('equal at start', () => {
    const beforeValue = [{ a: 1, children: [{ a: 1 }, { a: 3 }] }];
    const afterValue = [{ a: 1, children: [{ a: 1 }] }];
    expect(
      diffJson<any>(beforeValue, afterValue, {
        objectEq: (prefix, beforeValue, afterValue) => beforeValue.a === afterValue.a,
        partialArrayKey: true,
      }),
    ).toEqual([{ a: 1, children: [{ [OLD_VALUE_KEY]: { a: 3 } }] }]);
  });

  test('equal at end', () => {
    const beforeValue = [{ a: 1, children: [{ a: 1 }] }];
    const afterValue = [{ a: 1, children: [{ a: 3 }, { a: 1 }] }];
    expect(
      diffJson<any>(beforeValue, afterValue, {
        objectEq: (prefix, beforeValue, afterValue) => beforeValue.a === afterValue.a,
        partialArrayKey: true,
      }),
    ).toEqual([{ a: 1, children: [{ [NEW_VALUE_KEY]: { a: 3 } }] }]);
  });

  test('only specified key will be removed', () => {
    const beforeValue = [{ a: 1, children: [{ a: 1, b: [2, 3] }, { a: 2 }] }];
    const afterValue = [{ a: 1, children: [{ a: 1, b: [2, 1] }, { a: 2 }, { a: 3 }] }];
    expect(
      diffJson<any>(beforeValue, afterValue, {
        objectEq: (prefix, beforeValue, afterValue) => beforeValue.a === afterValue.a,
        partialArrayKey: 'children',
      }),
    ).toEqual([
      { a: 1, children: [{ a: 1, b: [2, { [NEW_VALUE_KEY]: 1, [OLD_VALUE_KEY]: 3 }] }, { [NEW_VALUE_KEY]: { a: 3 } }] },
    ]);
  });
});
