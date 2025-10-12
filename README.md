# THE 7TH GAME — Cloudflare Pages

Seven clues. One story. One truth.  
Static pages + Cloudflare Pages Functions + KV.

## Structure
- `/` home
- `/stories/the-inn-that-never-sleeps/` story page
- `/api/verify/:slug` POST {answer, clientFP} -> {ok, rank?, solverId?}
- `/api/claim/:slug`  POST {solverId, name}   -> {ok}
- `/api/leaderboard/:slug` GET -> top-20 ranks (names only)

## KV Keys
- `the7:story:{slug}:counter`  // total correct count
- `the7:story:{slug}:solvers`  // JSON array of solverIds (set semantics)
- `the7:story:{slug}:names`    // JSON map { solverId: name }
- `the7:story:{slug}:fps:{minute}` // JSON set for rate-limit window

## Deploy (Cloudflare Pages)
- Connect GitHub repo
- Enable Functions
- Bind KV to `KV` (prod + preview)
- No build command required

## Notes
- Server responses never reveal the solution.
- Rank is assigned on first correct verification per solverId.
- SolverId = SHA-256(slug + UA + IP[coarse]); no raw IP stored.
