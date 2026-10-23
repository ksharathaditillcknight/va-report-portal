// GET /api/health : tells the page it can send reports through Vercel.
const { checkPassword, common } = require("../lib/auth");

module.exports = (req, res) => {
  common(res);
  if (!checkPassword(req, res)) return;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: true, credentials: Boolean(process.env.CLIENT_ID && process.env.CLIENT_SECRET) }));
};
