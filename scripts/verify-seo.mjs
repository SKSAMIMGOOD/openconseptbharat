import fs from "node:fs";

console.log("=== VERIFYING HOMEPAGE HTML ===");
const html = fs.readFileSync(".next/server/app/index.html", "utf8");

const titleMatch = html.match(/<title>([^<]*)<\/title>/);
console.log("TITLE:", titleMatch ? titleMatch[1] : "NOT FOUND");

const descMatch = html.match(/<meta name="description" content="([^"]*)"/);
console.log("META DESCRIPTION:", descMatch ? descMatch[1] : "NOT FOUND");

const canonicalMatch = html.match(/<link rel="canonical" href="([^"]*)"/);
console.log("CANONICAL:", canonicalMatch ? canonicalMatch[1] : "NOT FOUND");

const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]*)"/);
console.log("OG TITLE:", ogTitleMatch ? ogTitleMatch[1] : "NOT FOUND");

const ogImageMatch = html.match(/<meta property="og:image" content="([^"]*)"/);
console.log("OG IMAGE:", ogImageMatch ? ogImageMatch[1] : "NOT FOUND");

const twitterCardMatch = html.match(/<meta name="twitter:card" content="([^"]*)"/);
console.log("TWITTER CARD:", twitterCardMatch ? twitterCardMatch[1] : "NOT FOUND");

const iconMatches = html.match(/<link[^>]*rel="(?:icon|apple-touch-icon|shortcut icon)"[^>]*>/g);
console.log("ICONS FOUND:", iconMatches ? iconMatches.length : 0);
if (iconMatches) {
  iconMatches.forEach((ic) => console.log("  ", ic));
}

const h1Matches = html.match(/<h1[^>]*>.*?<\/h1>/gs);
console.log("H1 TAGS FOUND:", h1Matches ? h1Matches.length : 0);
if (h1Matches) {
  h1Matches.forEach((h, i) =>
    console.log(`  H1 [${i}]:`, h.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim())
  );
}

const ldjsonMatches = html.match(/<script type="application\/ld\+json">([^<]*)<\/script>/g);
console.log("JSON-LD STRUCTURED DATA BLOCKS:", ldjsonMatches ? ldjsonMatches.length : 0);
if (ldjsonMatches) {
  ldjsonMatches.forEach((s, i) => console.log(`  JSON-LD [${i}]:`, s));
}

console.log("\n=== VERIFYING TOOL PAGE (photo-studio) ===");
const psHtml = fs.readFileSync(".next/server/app/tools/photo-studio.html", "utf8");
const psTitle = psHtml.match(/<title>([^<]*)<\/title>/);
console.log("PHOTO STUDIO TITLE:", psTitle ? psTitle[1] : "NOT FOUND");
const psDesc = psHtml.match(/<meta name="description" content="([^"]*)"/);
console.log("PHOTO STUDIO DESC:", psDesc ? psDesc[1] : "NOT FOUND");
const psCanonical = psHtml.match(/<link rel="canonical" href="([^"]*)"/);
console.log("PHOTO STUDIO CANONICAL:", psCanonical ? psCanonical[1] : "NOT FOUND");
const psH1 = psHtml.match(/<h1[^>]*>.*?<\/h1>/gs);
console.log("PHOTO STUDIO H1:", psH1 ? psH1[0].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : "NOT FOUND");
const psLdjson = psHtml.match(/<script type="application\/ld\+json">([^<]*)<\/script>/g);
console.log("PHOTO STUDIO JSON-LD BLOCKS:", psLdjson ? psLdjson.length : 0);
if (psLdjson) {
  psLdjson.forEach((s, i) => console.log(`  JSON-LD [${i}]:`, s));
}
