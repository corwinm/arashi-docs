import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, test } from "node:test";

import { checkUrl } from "./check-external-links.ts";

const methods: string[] = [];
const server = createServer((request, response) => {
  methods.push(`${request.url}:${request.method}`);
  const route = request.url ?? "/";
  if (route === "/head-error-get-200" && request.method === "HEAD") {
    request.socket.destroy();
    return;
  }
  if (route === "/head-404-get-200") {
    response.statusCode = request.method === "HEAD" ? 404 : 200;
  } else if (route === "/head-error-get-200") {
    response.statusCode = 200;
  } else if (route === "/head-503-get-404") {
    response.statusCode = request.method === "HEAD" ? 503 : 404;
  } else {
    response.statusCode = 204;
  }
  response.end();
});

let baseUrl = "";

before(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

test("accepts a successful GET after an unsuccessful HEAD", async () => {
  methods.length = 0;

  assert.deepEqual(await checkUrl(`${baseUrl}/head-404-get-200`), { ok: true });
  assert.deepEqual(methods, [
    "/head-404-get-200:HEAD",
    "/head-404-get-200:GET",
  ]);
});

test("reports the final GET failure after an unsuccessful HEAD", async () => {
  methods.length = 0;

  assert.deepEqual(await checkUrl(`${baseUrl}/head-503-get-404`), {
    ok: false,
    reason: "status 404",
  });
  assert.deepEqual(methods, [
    "/head-503-get-404:HEAD",
    "/head-503-get-404:GET",
  ]);
});

test("falls back to GET when the HEAD request itself fails", async () => {
  methods.length = 0;

  assert.deepEqual(await checkUrl(`${baseUrl}/head-error-get-200`), { ok: true });
  assert.deepEqual(methods, [
    "/head-error-get-200:HEAD",
    "/head-error-get-200:GET",
  ]);
});

test("does not issue GET after a successful HEAD", async () => {
  methods.length = 0;

  assert.deepEqual(await checkUrl(`${baseUrl}/head-204`), { ok: true });
  assert.deepEqual(methods, ["/head-204:HEAD"]);
});
