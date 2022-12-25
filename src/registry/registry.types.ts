export type SemverString = `${string}.${string}.${string}`;

type NpmUser = { name: string; email: string };

export type NpmResponse = {
  name: string;
  version: SemverString;
  description?: string;
  license?: string;
  maintainers?: NpmUser[];
  dist?: {
    integrity: string;
    shasum: string;
    tarball: string;
    fileCount: number;
    unpackedSize: number;
    'npm-signature': string;
  };
  gitHead?: string;
  _npmUser?: NpmUser;
  _id: string;
};
