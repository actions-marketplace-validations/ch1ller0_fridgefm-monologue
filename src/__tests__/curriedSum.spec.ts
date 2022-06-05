import { curriedSum } from '../index';

describe('curriedSum', () => {
  it('basic', () => {
    const get3 = curriedSum(1)(2)();
    expect(get3).toEqual(3);
    expect(curriedSum(1)(2)(3)()).toEqual(6);
    expect(curriedSum(1)(2)(3)(4)()).toEqual(10);
  });

  it('extended', () => {
    const add6 = curriedSum(1)(5)(0);
    const add16 = curriedSum(4)(4)(4)(4);

    expect(add6(4)()).toEqual(10);
    expect(add16(4)()).toEqual(20);
  });
});
