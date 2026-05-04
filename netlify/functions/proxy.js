const https = require("https");
const http = require("http");

function fetchUrl(url, callback) {
  const client = url.startsWith("https") ? https : http;
  const options = {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      "Accept-Encoding": "identity",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
    },
  };

  const req = client.get(url, options, (res) => {
    // Follow redirects
    if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
      const location = res.headers.location;
      if (location) {
        fetchUrl(location.startsWith("http") ? location : new URL(location, url).href, callback);
        return;
      }
    }

    if (res.statusCode !== 200) {
      callback(new Error(`Status ${res.statusCode}`), null, null);
      return;
    }

    const chunks = [];
    res.on("data", (chunk) => chunks.push(chunk));
    res.on("end", () => {
      const buffer = Buffer.concat(chunks);
      const contentType = res.headers["content-type"] || "image/jpeg";
      callback(null, buffer, contentType);
    });
    res.on("error", (e) => callback(e, null, null));
  });

  req.on("error", (e) => callback(e, null, null));
  req.setTimeout(8000, () => {
    req.destroy();
    callback(new Error("Timeout"), null, null);
  });
}

exports.handler = function (event, context, callback) {
  const url = event.queryStringParameters && event.queryStringParameters.url;

  if (!url) {
    return callback(null, { statusCode: 400, body: "Missing url parameter" });
  }

  fetchUrl(url, (err, buffer, contentType) => {
    if (err || !buffer) {
      return callback(null, {
        statusCode: 500,
        body: "Failed: " + (err ? err.message : "no data"),
      });
    }

    callback(null, {
      statusCode: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=2592000",
        "Access-Control-Allow-Origin": "*",
        "X-Content-Type-Options": "nosniff",
      },
      body: buffer.toString("base64"),
      isBase64Encoded: true,
    });
  });
};
