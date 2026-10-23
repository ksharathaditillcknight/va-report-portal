// Optional site password. When DEMO_USER and DEMO_PASSWORD are set in Vercel,
// every request must carry them (the browser shows a sign-in box).
const crypto = require("crypto");

function same(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function checkPassword(req, res) {
  const user = process.env.DEMO_USER, pass = process.env.DEMO_PASSWORD;
  if (!user || !pass) return true;
  const h = req.headers.authorization || "";
  if (h.startsWith("Basic ")) {
    const [u, ...rest] = Buffer.from(h.slice(6), "base64").toString("utf8").split(":");
    if (same(u, user) && same(rest.join(":"), pass)) return true;
  }
  res.statusCode = 401;
  res.setHeader("WWW-Authenticate", 'Basic realm="Portal demo", charset="UTF-8"');
  res.setHeader("Content-Type", "text/plain");
  res.end("Sign in required.");
  return false;
}

function common(res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
}

module.exports = { checkPassword, common };
