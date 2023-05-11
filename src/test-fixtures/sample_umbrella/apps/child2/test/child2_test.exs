defmodule Child2Test do
  use ExUnit.Case
  doctest Child2

  test "greets the world" do
    assert Child2.hello() == :world
  end
end
