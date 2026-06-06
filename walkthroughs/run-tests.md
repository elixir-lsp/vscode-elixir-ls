# Run and debug tests

ElixirLS integrates ExUnit with VS Code's **Test Explorer**.

1. Open the **Testing** view from the Activity Bar (the beaker icon), or use the
   button below.
2. Your `test/**/*_test.exs` tests appear in the tree. Use the inline controls to:
   - **Run** a test, file, or your whole suite.
   - **Debug** a test — ElixirLS runs it under the debug adapter so you can set
     breakpoints and step through.
3. Results, failures, and the diff for failed assertions show up inline next to the
   test and in the Test Results panel.

> Prefer running tests from the editor gutter? Enable
> **`elixirLS.enableTestLenses`** to show "Run test" code lenses above each test in
> the source file.
