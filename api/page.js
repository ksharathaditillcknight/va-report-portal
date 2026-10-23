// GET / : the portal page (after the optional password check).
const { checkPassword, common } = require("../lib/auth");
const html = require("../lib/page-html");

module.exports = (req, res) => {
  common(res);
  if (!checkPassword(req, res)) return;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(html);
};
