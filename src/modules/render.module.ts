import { createToken, declareModule, injectable } from '@fridgefm/inverter';
import pino, { type Logger } from 'pino';
import Table from 'cli-table3';
import pinoPretty from 'pino-pretty';

type RenderService = {
  table: (data: Record<string, string>[] | Record<string, string>) => void;
};

export const LOGGER = createToken<Logger>('render:logger');
export const RENDER_SERVICE = createToken<RenderService>('render:service');

export const RenderModule = declareModule({
  name: 'RenderModule',
  providers: [
    injectable({
      provide: LOGGER,
      useValue: pino(pinoPretty({ colorize: true })),
    }),
    injectable({
      provide: RENDER_SERVICE,
      useValue: {
        table: (data) => {
          if (Array.isArray(data)) {
            const allKeys = data.reduce((acc, cur) => {
              const keys = Object.keys(cur);
              keys.forEach((key) => {
                acc[key] = true;
              });
              return acc;
            }, {} as Record<string, true>);
            const head = Object.keys(allKeys);
            const table = new Table({ head, style: { head: ['cyan'], border: [] } });

            data.forEach((keyValue) => {
              const values = Object.keys(keyValue).reduce((acc, key) => {
                const index = head.indexOf(key);
                acc[index] = keyValue[key]!;
                return acc;
              }, new Array(head.length).fill(''));
              table.push(values);
            });

            // eslint-disable-next-line no-console
            console.log(table.toString());
          } else {
            const table = new Table({ style: { border: [] } });
            const splitted = Object.keys(data).reduce((acc, key) => {
              acc.push({ [key]: data[key]! });
              return acc;
            }, [] as Record<string, string>[]);

            table.push(...splitted);
            // eslint-disable-next-line no-console
            console.log(table.toString());
          }
        },
      },
    }),
  ],
});
