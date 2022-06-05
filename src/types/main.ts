export interface CurriedSum {
  (nextnum?: never): number;
  (nextnum: number): CurriedSum;
}
