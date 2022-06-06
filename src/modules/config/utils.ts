export const maskString = (s: string) => {
  const len = s.length;
  const letted = Math.floor(len / 3);
  const fixed = letted > 8 ? 8 : letted;
  const arr = (l: number) => new Array(l).fill('*').join('');

  return `${arr(len - fixed)}${fixed >= 1 ? s.slice(-fixed) : arr(fixed)}`;
};
