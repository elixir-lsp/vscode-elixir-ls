import { CodeLensProvider, TextDocument, Event, CodeLens, DocumentSelector, languages } from 'vscode';
import { Disposable } from 'vscode-languageclient';
import { ITestItem } from '../protocols';
import { searchTestCodeLens } from '../utils/commandsUtils';
import Commands from '../constants/commands';

export default class TestCodeLensProvider implements CodeLensProvider {
  onDidChangeCodeLenses?: Event<void> | undefined;

  private registeredProvider: Disposable | undefined;

  register(): void {
    if (this.registeredProvider) {
      this.registeredProvider.dispose();
    }

    const documentSelector: DocumentSelector = {
      language: 'elixir',
      scheme: 'file',
    };

    this.registeredProvider = languages.registerCodeLensProvider(documentSelector, this);
  }

  public async provideCodeLenses(document: TextDocument): Promise<CodeLens[]> {
    console.log("test code lens provider")
    const items: ITestItem[] = await searchTestCodeLens(document.uri.toString())

    // const lenses = 
    // console.log(lenses)
    return this.getCodeLenses(items);
  }

  private getCodeLenses(items: ITestItem[]): CodeLens[] {
    return items.map(item => new CodeLens(
      item.location.range,
      {
        title: 'Run test',
        command: Commands.RUN_TEST_FROM_CODELENS,
        tooltip: 'Run test in a terminal',
        arguments: [item]
      },
    ))
  }
}