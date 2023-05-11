defmodule SingleFolderMixTest do
  use ExUnit.Case
  doctest SingleFolderMix

  test "greets the world" do
    assert SingleFolderMix.hello() == :world
  end
end
