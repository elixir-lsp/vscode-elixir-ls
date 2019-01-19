declare module "gitty" {
  interface RepoConf {
    gitpath?: string,
    largeOperations?: string[],
    largeOperationsMacBuffer?: number,
  }

  export class Repository {
    constructor(repo: string, gitpathOrOpts?: string | RepoConf);

    static clone(path: string, url: string, creds?: object, callback?: (error: any) => void): void;
  }
}
