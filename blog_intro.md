# Introducing Elixir Language Server (ElixirLS)

I was a Ruby programmer before I discovered Elixir, and after making the switch, there's only one thing from Ruby I still miss: Rubymine, the excellent Ruby IDE from Jetbrains. I've been spoiled by good IDEs.

There is an open-source IntelliJ plugin for Elixir, and a few months ago, I started contributing to its development, adding ExUnit test support and debugger integration. IntelliJ and its plugins are written in Java (or other JVM languages), and as I worked on it, I became frustrated with having to write thousands of lines of Java when I really wanted to be writing Elixir. The code-base for IntelliJ Elixir is impressively large, featuring an Elixir parser that uses IntelliJ's Java-based lexing and parsing.

There's another approach that other editors are using -- write the code insight logic in Elixir, and run a server in separate process that communicates with the editor or IDE. The original Elixir editor plugin that used this approach was [Alchemist] for Emacs, and the author published the Elixir code as a separate server that could be used to power other editors. Another developer built upon Alchemist Server and created [Elixir Sense] which is being used in Atom and VS Code. With respect to IntelliJ Elixir, I'm convinced that the "language server" approach is the way to go because of the code-reuse it enables.

To eliminate the modest amount of custom code that needs to be written for each editor plugin, Microsoft and Red Hat have developed a standard protocol for communicating between the IDE and the language "smartness" server: The [Language Server Protocol](https://github.com/Microsoft/language-server-protocol). It's the standard way to write plugins for VS Code, Microsoft's lightweight IDE (which has little in common with Visual Studio), and for Eclipse Che, the latest variant of Eclipse by Red Hat. Microsoft has also published a spec for debugger integration with the IDE, the [VS Code debug protocol](https://github.com/Microsoft/vscode/blob/master/src/vs/workbench/parts/debug/common/debugProtocol.d.ts), though that hasn't gained as much traction. 

I've been working on a language server for Elixir, and I'm happy to announce an early alpha release of ElixirLS. It has the basic features you'd expect from an Elixir editor such as auto-completion, go-to-definition, and documentation lookup on hover. It also features automatic reporting of build warnings and errors (which is unfortunately [hacky and brittle]()), as well as debugger integration:

[screenshot]

At the moment, it's only tested on OSX using Elixir 1.4. 