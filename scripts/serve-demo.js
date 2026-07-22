import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("../", import.meta.url)));
const requestedPort = Number(process.env.BATTERY_DRAINER_PORT ?? 4173);

if (!Number.isInteger(requestedPort) || requestedPort < 1 || requestedPort > 65535) {
  throw new Error("BATTERY_DRAINER_PORT must be an integer between 1 and 65535");
}

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function send(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "text/plain; charset=utf-8",
    ...headers,
  });
  response.end(body);
}

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");
    if (requestUrl.pathname === "/") {
      send(response, 302, "Redirecting to the executive console.\n", {
        Location: "/example/",
      });
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent(requestUrl.pathname);
    } catch {
      send(response, 400, "Malformed URL.\n");
      return;
    }

    const requestedPath = resolve(projectRoot, `.${pathname}`);
    if (requestedPath !== projectRoot && !requestedPath.startsWith(`${projectRoot}${sep}`)) {
      send(response, 403, "That file is outside our depletion mandate.\n");
      return;
    }

    let filePath = requestedPath;
    let fileStats = await stat(filePath);
    if (fileStats.isDirectory()) {
      filePath = resolve(filePath, "index.html");
      fileStats = await stat(filePath);
    }
    if (!fileStats.isFile()) throw new Error("Not a file");

    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Length": fileStats.size,
      "Content-Type": contentTypes[extname(filePath)] ?? "application/octet-stream",
    });
    createReadStream(filePath).pipe(response);
  } catch (error) {
    if (error?.code === "ENOENT" || error?.message === "Not a file") {
      send(response, 404, "Nothing useful was found here.\n");
      return;
    }
    send(response, 500, "The demo server experienced an unexpected productivity event.\n");
  }
});

server.listen(requestedPort, "127.0.0.1", () => {
  console.log(`Battery Drainer demo: http://127.0.0.1:${requestedPort}/example/`);
  console.log("Press Ctrl+C to stop the server and preserve what remains of civilization.");
});
