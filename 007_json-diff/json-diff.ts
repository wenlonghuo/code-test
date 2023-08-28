import { diff } from 'fast-myers-diff';

export const OLD_VALUE_KEY = '__old';
export const NEW_VALUE_KEY = '__new';

const EMPTY_SYMBOL = Symbol('empty');

export type DiffJsonToLeafResult<T> = T extends unknown[]
  ? Array<DiffJsonResult<T[0]>>
  : T extends object
  ? {
      [K in keyof T]: DiffJsonResult<T[K]>;
    }
  : T & { [OLD_VALUE_KEY]?: T; [NEW_VALUE_KEY]: T };

export type DiffJsonResult<T> = T extends unknown[]
  ? Array<DiffJsonResult<T[0]>>
  : T extends object
  ? {
      [K in keyof T]: DiffJsonResult<T[K]>;
    } & { [OLD_VALUE_KEY]?: T; [NEW_VALUE_KEY]?: T }
  : T & { [OLD_VALUE_KEY]?: T; [NEW_VALUE_KEY]: T };

interface DiffOption<T> {
  objectEq?: (prefix: string[], beforeValue: T, afterValue: T, beforeIndex: number, afterIndex: number) => boolean;
  //  patch action to leaf for array.
  arrayPatchToLeaf?: boolean;
  // only change item will be reserved, equal item will be dropped
  partialArrayKey?: string | boolean;
}

const isPlainObject = (input: unknown): input is Exclude<object, null> => {
  return input ? typeof input === 'object' && !Array.isArray(input) : false;
};

const isNeedPartialArray = (option: { partialArrayKey?: string | boolean }, prefixList): boolean => {
  const { partialArrayKey } = option;
  if (partialArrayKey === true) {
    return true;
  }

  if (!partialArrayKey) {
    return false;
  }
  // for root array case
  if (!prefixList[prefixList.length - 1]) {
    return true;
  }

  return partialArrayKey === prefixList[prefixList.length - 1];
};

const patchArrayChangeToLeaf = (input: unknown, key: string): unknown[] | Record<string, unknown> => {
  if (Array.isArray(input)) {
    return input.map((item) => patchArrayChangeToLeaf(item, key));
  }
  if (isPlainObject(input)) {
    return Object.keys(input).reduce((prev, next) => {
      const value = input[next];
      prev[next] = patchArrayChangeToLeaf(value, key);
      return prev;
    }, {});
  }
  return { [key]: input };
};

interface DiffFragmentChildrenOption<JsonModel> {
  before: JsonModel[];
  after: JsonModel[];
  option: DiffOption<JsonModel>;
  prefix: string[];
  needPartial: boolean;
}
const diffFragmentChildren = <JsonModel extends object>({
  before,
  after,
  option,
  prefix = [],
  needPartial,
}: DiffFragmentChildrenOption<JsonModel>): {
  changed: boolean;
  result: DiffJsonResult<JsonModel[]>;
} => {
  let changed = false;
  const result = before
    .map((beforeValue, beforeFragmentIndex) => {
      const afterValue = after[beforeFragmentIndex];
      if (Array.isArray(beforeValue) && Array.isArray(afterValue)) {
        const diffRes = diffArray<JsonModel>(beforeValue, afterValue, option, prefix);

        if (diffRes.changed) {
          changed = true;
        }

        if (needPartial && !diffRes.changed) {
          return EMPTY_SYMBOL;
        }
        return diffRes;
      }

      if (isPlainObject(beforeValue) && isPlainObject(afterValue)) {
        const diffRes = diffObject<JsonModel>(beforeValue, afterValue, option, prefix);

        if (diffRes.changed) {
          changed = true;
        }

        if (needPartial && !diffRes.changed) {
          return EMPTY_SYMBOL;
        }
        return diffRes.result;
      }

      if (beforeValue === afterValue) {
        return needPartial ? EMPTY_SYMBOL : beforeValue;
      }

      changed = true;
      if (
        option.arrayPatchToLeaf &&
        afterValue === undefined &&
        (Array.isArray(beforeValue) || isPlainObject(beforeValue))
      ) {
        return patchArrayChangeToLeaf(beforeValue, OLD_VALUE_KEY);
      }

      if (
        option.arrayPatchToLeaf &&
        !beforeValue === undefined &&
        (Array.isArray(afterValue) || isPlainObject(afterValue))
      ) {
        return patchArrayChangeToLeaf(afterValue, NEW_VALUE_KEY);
      }
      return { [OLD_VALUE_KEY]: beforeValue, [NEW_VALUE_KEY]: afterValue };
    })
    .filter((item) => item !== EMPTY_SYMBOL);
  return {
    changed,
    result: result as DiffJsonResult<JsonModel[]>,
  };
};

function diffArray<JsonModel extends object>(
  beforeArray: Array<JsonModel>,
  afterArray: Array<JsonModel>,
  option: DiffOption<JsonModel>,
  prefix: string[] = [],
): {
  changed: boolean;
  result: DiffJsonResult<JsonModel[]>;
} {
  const eq = option.objectEq
    ? (beforeIndex: number, afterIndex: number) => {
        const beforeValue = beforeArray[beforeIndex];
        const afterValue = afterArray[afterIndex];
        if (Array.isArray(beforeValue) && Array.isArray(afterValue)) {
          return beforeIndex === afterIndex;
        }
        if (isPlainObject(beforeValue) && isPlainObject(afterValue)) {
          return option.objectEq!(prefix, beforeValue, afterValue, beforeIndex, afterIndex);
        }
        return beforeValue === afterValue;
      }
    : undefined;
  const diffResult = Array.from(diff(beforeArray, afterArray, eq));

  const result: unknown[] = [];
  let beforeIndex = 0;
  let afterIndex = 0;
  let changed = false;

  const needPartial = isNeedPartialArray(option, prefix);

  for (const [beforeStartIndex, beforeEndIndex, afterStartIndex, afterEndIndex] of diffResult) {
    const equalList = beforeArray.slice(beforeIndex, beforeStartIndex);
    if (equalList.length) {
      const preEqualListRes = diffFragmentChildren<JsonModel>({
        before: beforeArray.slice(beforeIndex, beforeStartIndex),
        after: afterArray.slice(afterIndex, afterStartIndex),
        option,
        prefix,
        needPartial,
      });
      result.push(...preEqualListRes.result);
    }

    // always true, if no changes, this code won't be executed.
    changed = true;
    beforeIndex = beforeEndIndex;
    afterIndex = afterEndIndex;

    const beforeLen = beforeEndIndex - beforeStartIndex;
    const afterLen = afterEndIndex - afterStartIndex;

    // add new Element
    if (beforeLen === 0) {
      result.push(
        ...afterArray
          .slice(afterStartIndex, afterEndIndex)
          .map((value) =>
            option.arrayPatchToLeaf ? patchArrayChangeToLeaf(value, NEW_VALUE_KEY) : { [NEW_VALUE_KEY]: value },
          ),
      );
      continue;
    }

    // delete elements
    if (afterLen === 0) {
      result.push(
        ...beforeArray
          .slice(beforeStartIndex, beforeEndIndex)
          .map((value) =>
            option.arrayPatchToLeaf ? patchArrayChangeToLeaf(value, OLD_VALUE_KEY) : { [OLD_VALUE_KEY]: value },
          ),
      );
      continue;
    }

    // modify
    const beforeFragment = beforeArray.slice(beforeStartIndex, beforeEndIndex);
    const afterFragment = afterArray.slice(afterStartIndex, afterEndIndex);

    if (beforeLen === afterLen) {
      result.push(
        ...diffFragmentChildren({ before: beforeFragment, after: afterFragment, option, prefix, needPartial }).result,
      );
      continue;
    }

    // delete and add
    result.push(
      ...beforeFragment.map((value) =>
        option.arrayPatchToLeaf ? patchArrayChangeToLeaf(value, OLD_VALUE_KEY) : { [OLD_VALUE_KEY]: value },
      ),
    );
    result.push(
      ...afterFragment.map((value) =>
        option.arrayPatchToLeaf ? patchArrayChangeToLeaf(value, NEW_VALUE_KEY) : { [NEW_VALUE_KEY]: value },
      ),
    );
  }

  if (beforeIndex < beforeArray.length) {
    const diffRes = diffFragmentChildren({
      before: beforeArray.slice(beforeIndex),
      after: afterArray.slice(afterIndex),
      option,
      prefix,
      needPartial,
    });
    if (diffRes.changed) {
      changed = true;
    }
    result.push(...diffRes.result);
  }

  return { changed, result: result as DiffJsonResult<JsonModel[]> };
}

function diffObject<JsonModel extends object>(
  beforeObject: object,
  afterObject: object,
  option: DiffOption<JsonModel>,
  prefix: string[] = [],
): {
  changed: boolean;
  result: DiffJsonResult<JsonModel>;
} {
  const objectKeys = Array.from(new Set([...Object.keys(beforeObject), ...Object.keys(afterObject)]));
  const result = {};
  let changed = false;

  objectKeys.forEach((key) => {
    const beforeValue = beforeObject[key];
    const afterValue = afterObject[key];
    const nextPrefix = prefix.concat(key);

    if (Array.isArray(beforeValue) && Array.isArray(afterValue)) {
      const diffRes = diffArray<JsonModel>(beforeValue, afterValue, option, nextPrefix);
      result[key] = diffRes.result;

      if (diffRes.changed) {
        changed = true;
      }
      return;
    }

    if (isPlainObject(beforeValue) && isPlainObject(afterValue)) {
      const diffRes = diffObject<JsonModel>(beforeValue, afterValue, option, nextPrefix);
      result[key] = diffRes.result;
      if (diffRes.changed) {
        changed = true;
      }
      return;
    }

    if (beforeValue === afterValue) {
      result[key] = beforeValue;
      return;
    }
    changed = true;

    if (
      option.arrayPatchToLeaf &&
      afterValue === undefined &&
      (Array.isArray(beforeValue) || isPlainObject(beforeValue))
    ) {
      result[key] = patchArrayChangeToLeaf(beforeValue, OLD_VALUE_KEY);
      return;
    }

    if (
      option.arrayPatchToLeaf &&
      beforeValue === undefined &&
      (Array.isArray(afterValue) || isPlainObject(afterValue))
    ) {
      result[key] = patchArrayChangeToLeaf(afterValue, NEW_VALUE_KEY);
      return;
    }

    result[key] = { [OLD_VALUE_KEY]: beforeValue, [NEW_VALUE_KEY]: afterValue };
  });

  return {
    changed,
    result: result as DiffJsonResult<JsonModel>,
  };
}

export function diffJson<JsonModel extends unknown[]>(
  beforeJson: JsonModel,
  afterJson: JsonModel,
  option: DiffOption<JsonModel[0]>,
): DiffJsonToLeafResult<JsonModel[0]>[];
export function diffJson<JsonModel extends object>(
  beforeJson: JsonModel,
  afterJson: JsonModel,
  option: DiffOption<JsonModel>,
): DiffJsonToLeafResult<JsonModel>;
export function diffJson<JsonModel = any>(
  beforeJson: JsonModel | Array<JsonModel>,
  afterJson: JsonModel | Array<JsonModel>,
  option: DiffOption<JsonModel>,
): DiffJsonToLeafResult<JsonModel> {
  if (Array.isArray(beforeJson) && Array.isArray(afterJson)) {
    return diffArray<any>(beforeJson, afterJson, option).result as DiffJsonToLeafResult<JsonModel>;
  }

  if (isPlainObject(beforeJson) && isPlainObject(afterJson)) {
    return diffObject<JsonModel extends object ? JsonModel : any>(beforeJson, afterJson, option).result;
  }

  return { [OLD_VALUE_KEY]: beforeJson, [NEW_VALUE_KEY]: afterJson } as any;
}
