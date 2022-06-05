/* eslint-disable no-console */
import type { CurriedSum } from './types/main';

const curriedSum = (num: number): CurriedSum => {
  const func = (nextnum?: number) => {
    if (nextnum !== undefined) {
      return curriedSum(num + nextnum);
    }
    return num;
  };

  return func as CurriedSum;
};

const add16 = curriedSum(16);

console.log(add16());
console.log(add16(10)());

export { curriedSum };
