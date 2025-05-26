import { Elysia } from "elysia";
import { server } from "../src/index";
import { describe, test, expect } from "bun:test";

describe("Brave Search Server", () => {
  test("GET / should return 200 OK", async () => {
    const app = new Elysia().use(server);
    const response = await app.handle(new Request("http://localhost/"));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("OK");
  });

  test("POST /search should return 400 if no query is provided", async () => {
    const app = new Elysia().use(server);
    const response = await app.handle(
      new Request("http://localhost/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    expect(response.status).toBe(400);
  });

  test("POST /search should return 500 if BRAVE_SEARCH_API_KEY is not set", async () => {
    const originalApiKey = process.env.BRAVE_SEARCH_API_KEY;
    delete process.env.BRAVE_SEARCH_API_KEY; // Remove API key

    const app = new Elysia().use(server);
    const response = await app.handle(
      new Request("http://localhost/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "test" }),
      })
    );
    expect(response.status).toBe(500);

    process.env.BRAVE_SEARCH_API_KEY = originalApiKey; // Restore API key
  });

  test("POST /search should return 401 if BRAVE_SEARCH_API_KEY is invalid", async () => {
    const originalApiKey = process.env.BRAVE_SEARCH_API_KEY;
    process.env.BRAVE_SEARCH_API_KEY = "invalid_api_key"; // Set invalid API key

    // Mock fetch to simulate an invalid API key response
    global.fetch = async () =>
      new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });

    const app = new Elysia().use(server);
    const response = await app.handle(
      new Request("http://localhost/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "test" }),
      })
    );
    expect(response.status).toBe(401);

    process.env.BRAVE_SEARCH_API_KEY = originalApiKey; // Restore API key
    // @ts-ignore
    delete global.fetch; // Restore fetch
  });

  test("POST /search should return 200 and search results if API call is successful", async () => {
    const originalApiKey = process.env.BRAVE_SEARCH_API_KEY;
    process.env.BRAVE_SEARCH_API_KEY = "valid_api_key"; // Set valid API key

    const mockSearchResults = {
      mixed: {
        type: "mixed",
        main: [
          { type: "web", title: "Test Result 1", url: "https://example.com/1" },
          { type: "web", title: "Test Result 2", url: "https://example.com/2" },
        ],
      },
    };

    // Mock fetch to simulate a successful API call
    global.fetch = async () =>
      new Response(JSON.stringify(mockSearchResults), { status: 200 });

    const app = new Elysia().use(server);
    const response = await app.handle(
      new Request("http://localhost/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "test" }),
      })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(mockSearchResults);

    process.env.BRAVE_SEARCH_API_KEY = originalApiKey; // Restore API key
    // @ts-ignore
    delete global.fetch; // Restore fetch
  });
});
