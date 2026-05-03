const https = require("https");
const http = require("http");

exports.handler = async (event) => {
  const url = event.queryStringParameters?.url;
  if (!url) return { statusCode: 400, body: "Missing url" };

  return new Promise((resolve) => {
    const client = url.startsWith("https") ? https : http;
    client.get(url, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          statusCode: 200,
          headers: {
            "Content-Type": res.headers["content-type"] || "image/jpeg",
            "Cache-Control": "public, max-age=86400",
            "Access-Control-Allow-Origin": "*",
          },
          body: buffer.toString("base64"),
          isBase64Encoded: true,
        });
      });
      res.on("error", () => resolve({ statusCode: 500, body: "Error" }));
    }).on("error", () => resolve({ statusCode: 500, body: "Error" }));
  });
};
