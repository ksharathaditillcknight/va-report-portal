Reporting portal demo for Vercel
================================
api/page.js      serves the portal page at /
api/report.js    sends reports to the intake API (holds the secret)
api/health.js    lets the page know it is connected
lib/auth.js      optional site password
lib/page-html.js the portal page itself

Environment variables (Vercel: Project > Settings > Environment Variables):
  CLIENT_ID       mandated-intake
  CLIENT_SECRET   the Keycloak client secret
  DEMO_USER       username for the site password (optional)
  DEMO_PASSWORD   password for the site (optional, recommended)

Deploy: npx vercel login, then npx vercel --prod (from this folder),
or import the GitHub repository in Vercel.
