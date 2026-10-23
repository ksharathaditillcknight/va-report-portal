// POST /api/report : logs in to Keycloak, then forwards the report to the intake API.
// The client secret comes from Vercel environment variables, never from the page.
const { checkPassword, common } = require("../lib/auth");

const TOKEN_URL = process.env.TOKEN_URL ||
  "https://d3dz7940mlunxp.cloudfront.net/realms/va-child-wlfr-sys/protocol/openid-connect/token";
const INTAKE_URL = process.env.INTAKE_URL ||
  "https://iv7ec0d57a.execute-api.us-east-1.amazonaws.com/dev/external/v1/programs/19259eb2-354f-431a-bd41-b6e0c6b1a930/mandated/applications";

let cached = { token: null, expiresAt: 0 };

async function getToken() {
  if (cached.token && Date.now() < cached.expiresAt - 30000) return cached.token;
  const id = process.env.CLIENT_ID, secret = process.env.CLIENT_SECRET;
  if (!id || !secret) throw new Error("CLIENT_ID and CLIENT_SECRET are not set in Vercel");
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: id, client_secret: secret })
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error(`Keycloak token request failed (${r.status}) ${j.error_description || j.error || ""}`.trim());
  cached = { token: j.access_token, expiresAt: Date.now() + (j.expires_in || 60) * 1000 };
  return cached.token;
}

async function forward(body, retry = true) {
  const token = await getToken();
  const r = await fetch(INTAKE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "Bearer " + token },
    body
  });
  if (r.status === 401 && retry) { cached = { token: null, expiresAt: 0 }; return forward(body, false); }
  return { status: r.status, text: await r.text() };
}

function reply(res, status, text) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(text);
}

module.exports = async (req, res) => {
  common(res);
  if (!checkPassword(req, res)) return;
  if (req.method !== "POST") return reply(res, 405, JSON.stringify({ message: "Use POST" }));
  // Vercel usually parses a JSON body into an object; accept either form.
  let raw = typeof req.body === "string" ? req.body : (req.body && typeof req.body === "object" ? JSON.stringify(req.body) : "");
  if (!raw) return reply(res, 400, JSON.stringify({ message: "The report is empty or not valid JSON." }));
  if (raw.length > 100 * 1024) return reply(res, 413, JSON.stringify({ message: "The report is too large." }));
  try { JSON.parse(raw); } catch { return reply(res, 400, JSON.stringify({ message: "The report is not valid JSON." })); }
  try {
    const out = await forward(raw);
    console.log("report forwarded, intake API answered", out.status); // never log the report itself
    return reply(res, out.status, out.text || "{}");
  } catch (e) {
    console.error("upstream error:", e.message);
    return reply(res, 502, JSON.stringify({ message: e.message }));
  }
};
