# Security

## Reporting a problem

Report security problems privately through GitHub:
https://github.com/syscli/algeria/security/advisories/new

Please do not open a public issue for them. You will get an answer within
7 days.

Wrong data (a misspelled name, a commune in the wrong wilaya) is an ordinary
bug: open a public issue and, if you can, point to the Journal officiel text
that shows the right value.

## Supported versions

Fixes go into the latest release. Until 1.0, there are no fixes for older
minor versions.

## What this package does

- It ships data and pure functions. It has no runtime dependencies and makes
  no network calls.
- Releases are published from GitHub Actions with npm provenance, so each
  version on npm can be traced to the commit and workflow that built it. Check
  it with `npm audit signatures`.
