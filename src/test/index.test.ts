import { search, LRUCache } from "../mcp";
import { describe, test, expect } from "bun:test";

describe("MCP Index", () => {
  test("should export search function", () => {
    expect(search).toBeDefined();
    expect(typeof search).toBe("function");
  });

  test("should export LRUCache class", () => {
    expect(LRUCache).toBeDefined();
    expect(typeof LRUCache).toBe("function");
  });
});
