#!/usr/bin/env node
import { declareContainer } from '@fridgefm/inverter';
import { containerConfig } from './container';
import { ROOT_FN_TOKEN } from './modules/root.module';

declareContainer(containerConfig).get(ROOT_FN_TOKEN)();
