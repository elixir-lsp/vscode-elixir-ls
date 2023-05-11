defmodule Child1Test do
  use ExUnit.Case
  doctest Child1

  test "greets the world" do
    assert Child1.hello() == :world
  end
end
