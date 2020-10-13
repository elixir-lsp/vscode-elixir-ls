import { Range } from 'vscode';

export interface ILocation {
  uri: string;
  range: Range;
};

export interface ITestItem {
  location: ILocation;
};
