# Debugging Elixir in Visual Studio Code

I recently released an early alpha of ElixirLS, a language "smartness" server for Elixir. It powers an associated VS Code plugin and includes debugger integration. Debugging in Elixir or Erlang is a little different than in other languages, so there's a few things you should know.

## You need Erlang >= OTP 19

As mentioned in this [blog post](http://blog.plataformatec.com.br/2016/04/debugging-techniques-in-elixir-lang/), you're going to need Erlang version OTP 19 or higher installed or a patched version of OTP 18. I highly recommend installing it from source using [kerl](https://github.com/kerl/kerl). That way, you can use the go-to-definition feature of your editor to jump to Erlang module source when you reference Erlang modules from Elixir.

## You have to "interpret" modules before you can debug them

When you debug a process in Elixir or Erlang, the VM spawns an additional process alongside the one you're debugging called the "meta process". After each step, the debugged process needs to send messages to the meta process about where it is in the program.

Your compiled .beam modules don't have the necessry function calls to send these messages. In other languages, you might compile two versions of your binaries, one with the neccessary debug calls and one without.

In Elixir and Erlang, it works slightly differently. When you compile Erlang or Elixir modules with the `:debug_info` option set (which is the default), the resulting .beam files include a chunk with the [Erlang Abstract Format](http://erlang.org/doc/apps/erts/absform.html) representation of your code. When you call `:int.ni/1`, it will read the module's `debug_info` chunk, then unload and purge the module. It'll handle any future calls to that module by evaluating the Erlang abstract forms one-by-one and making the necessary calls to the meta process after each evaluation.

Doing this manually for each module you care about when debugging is a pain, so when you run a Mix task in the ElixirLS debugger, it automatically interprets all the modules in your project and its dependencies. This is a good default for most projects, though it can cause a noticeable lag in starting the task. As with any language, code running in debug mode will run slower, so keep that in mind when profiling. Future versions of ElixirLS will likely include more configuration options to specify which modules to interpret.

As a consequence of having to interpret modules prior to debugging, you can't debug any code that lives outside of a module definition.

## .exs files are a bit tricky

Since .exs files aren't compiled, it can be a bit tricky to get `:int.ni/1` to interpret any modules they define. First, you'd need to load the file with `Code.load_file/1` so it can define the modules. Even then, though, `:int.ni/1` will refuse to interpret them because it can't find the .beam file.

But don't worry! We can still debug them. You need to add any .exs files you want to be included in debugging to your `launch.json` configuration under `"requireFiles"`. For example, the default configuration for `mix test` looks like this:

```
{
  "type": "mix_task",
  "name": "mix test",
  "request": "launch",
  "task": "test",
  "taskArgs": ["--trace"],
  "projectDir": "${workspaceRoot}",
  "requireFiles": [
    "test/**/test_helper.exs",
    "test/**/*_test.exs"
  ]
}
```

When the debugger starts, it creates a temporary folder `.elixir_ls/temp_beams` in your project root and adds it to the VM's code path. Before launching the task, it loads all the files specified under `"requireFiles"` in the order they're specified, and then it actually saves .beam files for any modules they defined to the temporary directory. That way, when we call `:int.ni/1` on those modules, it can find them in the code path and interpret them. Neat, huh?

Remember, though, that loading an .exs file is the same as running it -- it can have side-effects, so be careful.

## Variable names will look a little funny

If you look closely at the screenshot above, you'll see that the variables in the debugger have names like `conn@1` and `params@1`, even though the variables don't have these suffixes in the code. The reason for that has to do with the different variable scoping rules in Elixir and Erlang. In Erlang, variables are function-scoped and can't be redefined or masked within the function. In Elixir, however, the following code is perfectly valid:

```
my_var = 1
my_var = 2
```

The Beam VM can't handle multiple variables of the same name within a function, so Elixir makes it work by giving them "counters" as suffixes. In the debugger, you would see variables named `my_var@1` and `my_var@2`.

Unfortunately, that means that when you're debugging, you might have a hard time figuring out exactly which value applies to a given variable name. It's not always the one with the highest counter -- if you reassign a variable within a block, for example, after leaving the block, the variable will refer to whatever it did beforehand.

I'm not aware of any easy solutions to this, unfortunately.

## Line numbers might be missing or wrong

If you look at the docs for [Erlang Abstract Format](http://erlang.org/doc/apps/erts/absform.html), you'll see that each form includes metadata with the line number. Conspicuously missing, though, is metadata about which *file* that line is in.

In Erlang, there's a 1:1 relationship between source files and beam modules, so this isn't a problem. But in Elixir, we can use macros from other files. The forms these macros generate will use the line number from the file they were defined in, but the debugger won't know which file that was and will assume that all line numbers refer to the main source file for the module.

Consequently, it's common to see incorrect files or line numbers in debugger stack traces, particularly if they're in modules that make heavy use of macros, such as the router module in a Phoenix application. You can sometimes guess which file it's actually in, but I'm not aware of any easy programmatic solution.

## Future improvements?

The shortcomings I've mentioned are a consequence of having to debug by evaluating the Erlang Abstract Form representation of the code. Elixir has its own abstract form, the "quoted" form you work with when writing macros. If the debugger could evaluate Elixir quoted forms instead, it could potentially be more powerful.

If you think about it, `IEx` works basically by compiling the user's input to Elixir quoted form, evaluating the forms, and then pausing for user interaction. Making it interact with the debugger's meta process instead of the user isn't all that big a stretch. My guess is that the hardest part would be making it play nice with the existing Erlang debugger. I believe I saw a thread on an Erlang mailing list somewhere in which José Valim discussed the possibility of having the evaluator be pluggable, but I can no longer find the thread, so maybe I imagined it. I'd love to hear from some Elixir or Erlang devs about what it might take to improve debugging.

Despite its shortcomings, I hope you find ElixirLS's debugger integration useful. Happy coding!
