# Publishing Checklist (Safe GitHub Upload)

Use this checklist before making the repository public.

## 1) Ownership and Permission

- [ ] Confirm your collaborator agrees with public publication.
- [ ] Agree on attribution text and repository visibility.
- [ ] Confirm no contractual restriction prevents publication.

## 2) Secrets and Sensitive Data

- [ ] `.env*` files are ignored and not tracked.
- [ ] No hardcoded credentials remain in source code.
- [ ] No debug route exposes environment variables.
- [ ] API keys/passwords previously used are rotated.

## 3) Personal Data and Public Data

- [ ] Database dumps and exports are excluded.
- [ ] Seed data contains only synthetic/demo values.
- [ ] Logs and screenshots do not show personal data.

## 4) Publish Without Old Sensitive History

If old commits contained secrets, publish from a clean history:

```bash
# from project root
git checkout --orphan portfolio-public
git add .
git commit -m "Initial public portfolio release (sanitized)"
git branch -M main
git remote remove origin 2>/dev/null || true
git remote add origin <NEW_GITHUB_REPO_URL>
git push -u origin main
```

Notes:
- Use a new GitHub repo for the public version.
- Do not reuse the old remote if it contains sensitive history.

## 5) Final Review

- [ ] README explains portfolio context and collaboration credit.
- [ ] `.env.example` exists and is up to date.
- [ ] Project builds successfully with placeholder-safe configuration.
