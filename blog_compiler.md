# Compiler hacks in ElixirLS

I recently released ElixirLS, a language "smartness" server for Elixir that powers a VS Code plugin. More about that [here]().

One thing I wanted to achieve with this project was to have immediate builds with error reporting in the editor as you type. I ended up having to make some changes to Elixir's parallel compiler and the `compile.elixir` mix task to get the functionality I wanted. In the long run, maintaining a fork of Elixir's compiler modules isn't going to be viable, but I've decided to leave the changes in for the initial release with the hope of simplifying things later, possibly contributing some of these changes upstream.

## What's wrong with "mix compile"?

Nothing! It's really well-designed for CLI usage. There are a few things, though, that make it a little less than ideal for use in an IDE. Here are a few issues I tried to address.

### "mix compile" fails fast and doesn't write modules if the build fails

This makes total sense for CLI use, but it isn't ideal for an IDE.

Elixir language servers like ElixirLS, Alchemist Server, and Elixir Sense (which is used in ElixirLS) make use of a project's compiled modules to provide features like documentation lookup, code completion, and go-to-definition. So in order to provide these features, we need the project to compile.

Elixir's compile task keeps track of stale files by saving a "manifest" to the build directory. The manifest tracks dependencies between modules so that when you compile, the compiler can delete only modules that need recompilation and leave the rest unchanged. If, after deleting the stale modules, they fail to rebuild due to a build error, features like autocompletion will be unavailable for that code, but will still work for the rest of your project.

Suppose, though, that you have a lot of stale modules. When you first check out a project and try to build it, for example, all your code will be stale. If there are build errors anywhere in your project, no modules will get written to your build directory. Documentation lookup, code completion, and go-to-definition will be unavailable until you've fixed the build.

I'll admit, this isn't a huge deal. Most of the time, you'll be running `mix compile` frequently and very little of your project will be stale, so you'll have auto-completion and other features available and up-to-date for most of your project. But it is a shortcoming that you won't find in the best IDEs for other languages, so in an ideal Elixir IDE there'd be a way to solve this.

### "mix compile" only shows the first error it encounters

Again, this makes sense for a CLI workflow, but in an IDE, it'd be better if build errors that occur in different parts of the code could all be shown simultaneously in the editor. When `mix compile` encounters a build error, it immediately raises an exception, halting the build so that no modules are written and no other errors are shown.

### Warnings are lost after a successful build

If a file compiles with warnings, the next time you compile, those warnings are not shown unless you've changed the source or something it depends on. This is probably a good thing in the CLI, because otherwise you might be inundated with warnings every time you compile.

But in an IDE, it's helpful to show warnings wherever they exist in the code to assist with clean-up and debugging. To do that, we'd have to keep track of warnings between compilations.

### Files have to be written to disk before they can be compiled

The IDE informs ElixirLS about changes to source files even before they've been saved to disk. This can allow us to perform builds immediately and report errors as the user types, but as a CLI tool, `mix compile` doesn't have any way to accept files that are held in-memory instead of saved on disk. 

This isn't a huge deal -- VS Code can be set to autosave files as they're changed, so waiting until a file is saved causes only a slight lag between user input and the ensuing build. Ultimately, that might be the simplest way to go.

## What I changed

Here's what I changed to address these issues. I'm 

## Don't stop the build on errors

Currently, the `ParallelCompiler` module accepts an option for a function to call upon successfully compiling a file, which the compilation Mix task uses to keep track of modules that were built. I added another parameter for a function to call upon encountering an error, so instead of raising an exception, the `ParallelCompiler` calls this callback with the exception and the file it was in and continues compiling. The build finishes, any modules that were compiled successfully are written to the build path, and we update the manifest.

This solves several problems. We get all the build errors, not just the first one encountered, and we also write any modules that were compiled successfully to disk so that they can be used for documentation look-up, autocomplete, and go-to-definition. 

But this approach requires us to handle the stale-checking somewhat differently. Before, the manifest would only be updated upon a succesful build, and we'd use the manifest's timestamp to determine which source files have changed since the last successful build. Now, though, the manifest is updated even if the build fails, so we need to track for each source file whether it was built successfully or not. If the file had an error on the most recent build, then it's stale even if its timestamp is older than the manifest.

Despite the changes required to the stale-checking, I think this could potentially be a good change to make upstream in Elixir's compiler. The existing behavior is the right default for CLI users, but maybe it could support an option like `--continue-on-error` to improve its usability in an IDE. 

## Track warnings between builds

The logical place to keep track of warnings between builds is in the same place we keep track of everything else between builds: In the manifest. We can add a list of warnings that were generated for each source file entry, and it'll be updated every time that file is recompiled.

The tricky part, it turns out, is tracking the warnings at all. When the Elixir compiler emits a warning, it does so by printing it to stderr. The warnings aren't actually stored anywhere. In order to actually analyze or save the warnings, you have to read that CLI output.

Erlang's `:compiler.file/1` module returns warnings when compiling a file, making this one of the only places I've found Erlang to be a bit more accessible than Elixir. If we want to track build warnings in the manifest, it requires a bit of a hack.

Warnings are printed to the IO process or port registered as `:standard_error`. We can unregister the default and register our own to intercept those warning messages. I wrote a simple `WarningsTracker` module to do that. We start it up right before we begin to compile and shut it down right after, allowing us intercept the warnings before they're printed and save them to the manifest. That way, after any build, the manifest will include a full list of all the build warnings for the project.

While I think that tracking warnings somehow would be a good upstream change to make, this is clearly far too much of a hack. A better way to do it would probably involve sending a message to some process that tracks the warnings when they're generated. The compiler actually already does something very close to this. If you pass the `--warnings-as-errors` option, it raises an exception the first time it encounters a warning. It does this by sending a message to the parent process that manages the parallel compiler processes. However, at present, the message only tells the compiler that there was a warning, not what the warning contained. A small change to this behavior could allow us to track the warnings programatically without the dirty hack of usurping `:standard_error`.

## Allow ParallelCompiler to compile files kept as strings in-memory

At first, this seemed like a simple change. The `ParallelCompiler` currently takes a list of paths as a parameter, but Elixir's compiler can already accept either a file's path or the file's contents as input, so it was easy to change the `ParallelCompiler` to allow it to accept both as well.

The problem is that this totally messes up our stale-checking. For example, suppose you make changes to a source file in your editor and the changes are immediately built. Then you close the editor without saving it. The source file is now stale, but its on-disk timestamp is the same as before you opened and modified it, and the on-disk version of the file is actually older than the one you last compiled. This makes it way harder to keep track of which files are actual stale.

I have yet to find a good way of handling this. In ElixirLS, I did end up trying to track the changes between builds, but there are known bugs and my solution is inelegant. My inclination is to remove it altogether in the next version if I don't come up with a better way of doing it. If the user enables "autosave" in VS Code, files are quickly saved after any user input. Waiting for the `"textDocument/didSave"` notification before starting a build does increase the delay between user-input and build results, but only slightly. Given the complexity involved in building files held in-memory, I think that delay is acceptable.

## In conclusion...

I don't want ElixirLS to include a forked version of Elixir's compiler in the long run, but I thought it might be a useful proof-of-concept. The next step, I think, is to try implementing some of this behavior in Elixir itself and submitting a pull request if it looks viable. I'd love to hear thoughts from other Elixir devs.

Thanks for reading!