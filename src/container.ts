// import { registryProvider } from './providers/registry.provider';
// import { configProvider } from './providers/config.provider';
// import { semverProvider } from './providers/semver.provider';
// import { getReleaseTypeProvider } from './providers/releasetype.provider';
// import { loggerProvider } from './providers/logger.provider';
// import { rootProvider } from './providers/root.provider';
// import { PackageModule } from './providers/package.provider';
// import { releaseProvider } from './providers/release.provider';
// import { renderProvider } from './providers/render.provider';
// import { StrategiesModule } from './strategies/strategies.module';
import { RootModule } from './modules/root.module';
import { RenderModule } from './modules/render.module';
import { ConfigModule } from './modules/config/config.module';
import { PackageModule } from './modules/package.module';
import { RegistryModule } from './modules/registry/registry.module';
import { SemverModule } from './modules/semver.module';
import type { ContainerConfiguration } from '@fridgefm/inverter';

export const containerConfig: ContainerConfiguration = {
  modules: [RenderModule, ConfigModule, RootModule, PackageModule, RegistryModule, SemverModule],
  providers: [],
};
