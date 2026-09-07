# GitHub, Vercel, and ruagentic.org
The website exports static HTML, JavaScript, schemas, examples, and documentation. It needs no database, API key, environment secret, or runtime backend. The interactive lab is a browser simulation; the real HTTP/SQLite service is a separate local reference application.

## Vercel
Import sam1siam/agentic into the intended Vercel account.
- Framework preset: Other.
- Root directory: repository root.
- Install command: npm ci.
- Build command: npm run build.
- Output directory: dist/client.
- Node.js: 24.x.
vercel.json contains the build and output settings. The Vinext starter is retained with static export enabled; Vercel serves the output as a static site.

Run npm test and npm run build before publishing changes. npm run build prepares public artifacts and exports the website. It does not run Python tests; CI runs those separately.

## Spaceship DNS
Keep the domain registered at Spaceship unless a registrar transfer is independently desired. Add ruagentic.org to the Vercel project's Domains settings, then use the exact DNS record values shown for that project.

Do not guess A records, CNAME targets, or verification tokens. Preserve existing email and unrelated records. Update only the records needed for the selected hostname after checking any existing web destination. Add www only if desired and configure its redirect deliberately.

Check Vercel's domain verification and TLS status, then verify the root page, /spec/, /lab/, /validate/, /adopt/, /schemas/agentic-0.1.schema.json, and the example downloads on the final domain.

The .openai/hosting.json file identifies an optional private Sites preview and is unrelated to Vercel DNS. It contains no credential.
