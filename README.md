# blurxy.net

Personal portfolio for **Rafiul Bari** — cybersecurity student at CUNY City
Tech, graduating December 2026, seeking security internships and full-time
entry-level roles.

Live at **https://blurxy.net** — "follow the evidence".

The site is a single-file static board (`index.html`, inline CSS/JS, no build
step, no npm): 14 projects, an Experience card, and Investigation Notes from
the journal, in a dark board design with an amber accent.

## Deployment

Deployed by **Cloudflare Workers Static Assets** — project `blurxy-net`, from
this repo, branch `main`. Every push to `main` auto-deploys to blurxy.net
(about 20 seconds). There is no build command.

Config: `wrangler.jsonc` (`name: "blurxy-net"`, assets directory `.`).

The project was renamed from `worldcup26-61z` to `blurxy-net` in the Cloudflare
dashboard on 2026-11-19; the old `worldcup26-61z.coursewake.workers.dev` URL
no longer works.

## Sub-sites

These paths on blurxy.net are served by their own Workers, from their own
repos — not by this hub project:

| Path | Repo | Worker |
|---|---|---|
| `/worldcup26/` | [blurxy/worldcup26](https://github.com/blurxy/worldcup26) | `worldcup26` |
| `/kev/` | [blurxy/security-toolkit](https://github.com/blurxy/security-toolkit) (`public/kev`) | `security-toolkit` |
| `/osint/` | [blurxy/security-toolkit](https://github.com/blurxy/security-toolkit) (`public/osint`) | `security-toolkit` |
| `cactus.blurxy.net` | [blurxy/cactus-mccoy-3d](https://github.com/blurxy/cactus-mccoy-3d) | `cactus-mccoy-3d` |
| `coursewake.blurxy.net` | Coursewake (separate) | `coursewake-site` |

The `kev/`, `osint/` and `worldcup26/` folders in this repo contain only
"moved" stubs pointing at those repos. `_redirects` sends bare project paths
with a query string (`/kev?utm_source=x`) to their slash URLs with a 307, so
the sub-site Workers can serve them.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole site |
| `resume.html`, `resume.pdf` | Printable resume page and PDF (`/resume.html`) |
| `_redirects` | Bare-path 307 redirects to the sub-sites |
| `v1/index.html` | Archived earlier version of the board, served at `/v1/` |
| `wrangler.jsonc` | Cloudflare Workers Static Assets config |

## Local preview

No build step — serve the folder statically, e.g. `python3 -m http.server`
and open http://localhost:8000, or `npx wrangler dev`.

## Licence

MIT — see `LICENSE`.
