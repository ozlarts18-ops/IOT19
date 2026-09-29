const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".webp": "image/webp"
};

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    let reqPath = req.url.split("?")[0];
    if (reqPath === "/" || reqPath === "") {
        reqPath = "/index.html";
    }

    let filePath = path.join(__dirname, decodeURIComponent(reqPath));

    // Prevent directory traversal attacks
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403, { "Content-Type": "text/plain" });
        res.end("Forbidden");
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { "Content-Type": "text/html" });
            res.end("<h1>404 Not Found</h1><p>Requested file does not exist.</p>");
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";

        res.writeHead(200, { "Content-Type": contentType });
        fs.createReadStream(filePath).pipe(res);
    });
});

function startServer(port) {
    server.listen(port, () => {
        console.log("====================================================");
        console.log(`🌱 IOT19 Frontend Server is running at: http://localhost:${port}`);
        console.log(`📊 Dashboard:  http://localhost:${port}/dashboard.html`);
        console.log(`🔐 Login:      http://localhost:${port}/Login.html`);
        console.log(`📝 Register:   http://localhost:${port}/Regi.html`);
        console.log("====================================================");
    });
}

server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        const nextPort = Number(PORT) + 1;
        console.warn(`⚠️ Port ${PORT} is already in use. Retrying on port ${nextPort}...`);
        startServer(nextPort);
    } else {
        console.error("Server error:", err);
    }
});

startServer(PORT);
