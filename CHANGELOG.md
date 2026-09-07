# Changelog

All notable changes to this project will be documented in this file. The format is based on Keep a
Changelog, and this project follows Semantic Versioning.

## Unreleased

## 0.2.0 - 2026-09-07

### Added

- Added `referrer.hostname`, preserving the parsed hostname including `www` and other subdomains.

## 0.1.0 - 2026-09-07

### Added

- Stable `parseRequestInsights` API for device, browser, OS, referrer, and UTM insights.
- OpenPanel-derived UA fallbacks and attribution precedence.
- UAParser.js 2.0.10 as an exactly pinned runtime dependency.
- Snowplow referers 5.3 snapshot from 2026-08-27, with `chatbot` normalized to `ai`.
- Machine-readable upstream provenance and reproducible data generation.
- Automated formatting, linting, typechecking, testing, package validation, and Git hooks.
- Changesets-based release notes and an AI-agent upstream synchronization runbook.
