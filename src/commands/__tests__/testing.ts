import { ContainerConfig, createContainer, injectable } from '@fridgefm/inverter';
import { Injectable } from '@fridgefm/inverter/lib/base/injectable.types';

/**
 * Potentially this one will be moved to @fridgefm/inverter-test package
 */
export const createTestingModule = (cfg: ContainerConfig) => {
  const finalProviders = [...(cfg.providers || [])];
  const instance = {
    overrideProvider: (a: Injectable.SyncArgs) => {
      const newProvider = injectable(a);
      finalProviders.push(newProvider);
      return instance;
    },
    compile: () =>
      createContainer({
        modules: cfg.modules,
        providers: finalProviders,
      }),
  };

  return instance;
};
