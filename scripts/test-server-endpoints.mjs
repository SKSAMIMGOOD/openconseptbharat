import { spawn } from "node:child_process";
import http from "node:http";

function fetchEndpoint(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    }).on("error", reject);
  });
}

async function run() {
  const port = 3456;
  console.log(`Starting next server on port ${port}...`);
  const serverProc = spawn("node", ["node_modules/next/dist/bin/next", "start", "-p", String(port), "-H", "127.0.0.1"], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  serverProc.stdout.on("data", (d) => process.stdout.write(d));
  serverProc.stderr.on("data", (d) => process.stderr.write(d));

  try {
    let ready = false;
    for (let i = 0; i < 30; i++) {
      try {
        await new Promise((r) => setTimeout(r, 500));
        const res = await fetchEndpoint(`http://127.0.0.1:${port}/robots.txt`);
        if (res.statusCode === 200) {
          ready = true;
          break;
        }
      } catch (e) {
        // waiting
      }
    }

    if (!ready) {
      throw new Error("Server failed to respond within 15 seconds.");
    }

    console.log("\nServer is ready! Testing /sitemap.xml...");
    const sitemapRes = await fetchEndpoint(`http://127.0.0.1:${port}/sitemap.xml`);
    console.log(`HTTP Status: ${sitemapRes.statusCode}`);
    console.log(`Content-Type: ${sitemapRes.headers["content-type"]}`);
    if (sitemapRes.statusCode !== 200) {
      throw new Error(`Expected HTTP 200 for /sitemap.xml, got ${sitemapRes.statusCode}`);
    }
    if (sitemapRes.body.includes("browserutilitystudio.com")) {
      throw new Error("Found old domain browserutilitystudio.com in live sitemap response!");
    }
    if (!sitemapRes.body.includes("https://www.printreadydesigns.in")) {
      throw new Error("Missing official domain https://www.printreadydesigns.in in live sitemap response!");
    }
    console.log(">>> /sitemap.xml verified HTTP 200 with all https://www.printreadydesigns.in URLs! <<<");

    console.log("\nTesting /robots.txt...");
    const robotsRes = await fetchEndpoint(`http://127.0.0.1:${port}/robots.txt`);
    console.log(`HTTP Status: ${robotsRes.statusCode}`);
    console.log(robotsRes.body);
    if (robotsRes.statusCode !== 200) {
      throw new Error(`Expected HTTP 200 for /robots.txt, got ${robotsRes.statusCode}`);
    }
    if (!robotsRes.body.includes("https://www.printreadydesigns.in/sitemap.xml")) {
      throw new Error("Robots sitemap does not point to https://www.printreadydesigns.in/sitemap.xml");
    }
    console.log(">>> /robots.txt verified HTTP 200 and points to correct sitemap! <<<");

  } finally {
    serverProc.kill("SIGTERM");
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
