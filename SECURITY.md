# Security Policy

## Supported Versions

This repository is published as a portfolio project. Security fixes are best-effort.

## Reporting a Vulnerability

Please do not open public issues for sensitive vulnerabilities.
Use a private channel with the repository owner.

## Secure Configuration Rules

- Keep all credentials in environment variables only.
- Never commit `.env`, `.env.local`, service-account files, or private keys.
- Rotate credentials immediately if exposure is suspected.
- Remove debug endpoints that print environment variables.
- Avoid logging tokens, signatures, or personal data.

## Data Protection

- Do not include real personal data in seed scripts or fixtures.
- Use synthetic/demo values for local and public repositories.
- Ensure exported logs and screenshots are sanitized before sharing.
