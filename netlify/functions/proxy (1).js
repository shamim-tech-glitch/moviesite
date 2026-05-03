const https = require("https");
const http = require("http");

exports.handler = function(event, context, callback) {
  const url = event.queryStringParameters && event.queryStringParameters.url;

  if (!url) {
    return callback(null, { statusCode: 400, body: "Missing url" });
  }

  const client = url.startsWith("https") ? https : http;

  const options = {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; CineZone/1.0)",
      "Accept": "image/*",
      "Referer": "https://www.imdb.com/",
    },
  };

  client.get(url, options, (res) => {
    // Handle redirect
    if (res.statusCode === 301 || res.statusCode === 302) {
      const redirectUrl = res.headers.location;
      const redirectClient = redirectUrl.startsWith("https") ? https : http;
      redirectClient.get(redirectUrl, options, (res2) => {
        const chunks = [];
        res2.on("data", (chunk) => chunks.push(chunk));
        res2.on("end", () => {
          const buffer = Buffer.concat(chunks);
          callback(null, {
            statusCode: 200,
            headers: {
              "Content-Type": res2.headers["content-type"] || "image/jpeg",
              "Cache-Control": "public, max-age=604800",
              "Access-Control-Allow-Origin": "*",
            },
            body: buffer.toString("base64"),
            isBase64Encoded: true,
          });
        });
        res2.on("error", (e) => callback(null, { statusCode: 500, body: "Redirect error: " + e.message }));
      }).on("error", (e) => callback(null, { statusCode: 500, body: "Redirect error: " + e.message }));
      return;
    }

    const chunks = [];
    res.on("data", (chunk) => chunks.push(chunk));
    res.on("end", () => {
      const buffer = Buffer.concat(chunks);
      callback(null, {
        statusCode: 200,
        headers: {
          "Content-Type": res.headers["content-type"] || "image/jpeg",
          "Cache-Control": "public, max-age=604800",
          "Access-Control-Allow-Origin": "*",
        },
        body: buffer.toString("base64"),
        isBase64Encoded: true,
      });
    });
    res.on("error", (e) => callback(null, { statusCode: 500, body: "Stream error: " + e.message }));
  }).on("error", (e) => callback(null, { statusCode: 500, body: "Request error: " + e.message }));
};
