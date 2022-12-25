import { LoggerModule } from '../../logger/logger.module';
import { PackagesModule } from '../../package/package.module';
import { RegistryModule } from '../../registry/registry.module';
import { CliModule } from '../../cli/cli.module';
import { SemverModule } from '../../semver/semver.module';
import { publishProvider } from '../publish.command';
import { createTestingModule } from './testing';

const { REGISTRY } = RegistryModule.exports;
const { PACKAGES } = PackagesModule.exports;
const { CLI_RUN } = CliModule.exports;

const createMocks = () => {
  const packages = [
    { name: '@package/1', path: 'src/packages/1', remoteVersion: '0.0.1' },
    { name: '@package/2', path: 'src/packages/2', remoteVersion: '0.1.2' },
    { name: '@package/3', path: 'src/packages/3', remoteVersion: '1.2.3' },
    { name: '@private/1', path: 'src/privates/1', remoteVersion: undefined },
  ] as const;
  const findByName = (name: string) => packages.find((s) => s.name === name);

  return {
    registry: {
      packageInfo: jest.fn((name: string) => {
        const a = findByName(name);
        return Promise.resolve(
          a?.remoteVersion
            ? { name, version: a.remoteVersion, _id: Math.random().toString().slice(2, 8) }
            : undefined,
        );
      }),
      publishPackage: jest.fn(),
    },
    packages: {
      getLocalPackages: jest.fn(() =>
        Promise.resolve(
          packages.map((a) => ({
            path: a.path,
            packageJson: { name: a.name, version: '0.0.0-stub' as const },
          })),
        ),
      ),
    },
    render: { table: jest.fn() },
  };
};

describe('publish.command', () => {
  it('ok', async () => {
    const mocks = createMocks();
    const testingModule = createTestingModule({
      modules: [LoggerModule, SemverModule],
      providers: [publishProvider],
    })
      .overrideProvider({ provide: REGISTRY, useValue: mocks.registry })
      .overrideProvider({ provide: PACKAGES, useValue: mocks.packages })
      .compile();

    const abb = await testingModule.get(CLI_RUN);
    abb();
  });
});
