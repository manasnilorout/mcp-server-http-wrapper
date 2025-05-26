import { search } from "../mcp/search";
import { LRUCache } from "../mcp/lru";
import { describe, test, expect, beforeEach, spyOn } from "bun:test";

// Mock LRUCache
const mockCache = new LRUCache<string, any>(3);
const mockGet = spyOn(mockCache, "get");
const mockSet = spyOn(mockCache, "set");

// Mock fetch
global.fetch = async (url: string, options: any) => {
  const body = JSON.parse(options.body);
  if (body.query === "error") {
    return new Response("Error fetching results", { status: 500 });
  }
  return new Response(JSON.stringify({ query: body.query, results: `Results for ${body.query}` }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

describe("Search function", () => {
  beforeEach(() => {
    mockCache.clear();
    mockGet.mockClear();
    mockSet.mockClear();
  });

  test("should return cached result if query is found in cache", async () => {
    mockCache.set("test", { query: "test", results: "Cached results for test" });
    const result = await search("test", undefined, mockCache as any);
    expect(result).toEqual({ query: "test", results: "Cached results for test" });
    expect(mockGet).toHaveBeenCalledWith("test");
    expect(mockSet).not.toHaveBeenCalled();
  });

  test("should fetch result from API if query is not found in cache", async () => {
    const result = await search("new query", undefined, mockCache as any);
    expect(result).toEqual({ query: "new query", results: "Results for new query" });
    expect(mockGet).toHaveBeenCalledWith("new query");
    expect(mockSet).toHaveBeenCalledWith("new query", { query: "new query", results: "Results for new query" });
  });

  test("should throw error if API call fails", async () => {
    await expect(search("error", undefined, mockCache as any)).rejects.toThrow("Error fetching results");
    expect(mockGet).toHaveBeenCalledWith("error");
    expect(mockSet).not.toHaveBeenCalled();
  });

  test("should use provided service if specified", async () => {
    const mockService = {
      search: async (query: string) => ({ query, results: `Results from mock service for ${query}` }),
    };
    const result = await search("test service", mockService as any, mockCache as any);
    expect(result).toEqual({ query: "test service", results: "Results from mock service for test service" });
    expect(mockGet).toHaveBeenCalledWith("test service");
    expect(mockSet).toHaveBeenCalledWith("test service", { query: "test service", results: "Results from mock service for test service" });
  });
});
