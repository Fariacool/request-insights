# Third-party notices

This distribution contains or is derived from the following open-source projects.

## OpenPanel

- Source: <https://github.com/Openpanel-dev/openpanel>
- Recorded commit: `3060ca10213693cf0385be2713c8743d16733a2b`
- Copyright: OpenPanel contributors
- License: GNU Affero General Public License version 3

User-Agent fallback behavior, referrer composition behavior, selected tests, and the extra-referrer
map are derived from OpenPanel. OpenPanel trademarks are owned by their respective owner; this
project is independent and is not endorsed by or affiliated with OpenPanel.

## UAParser.js

- Source: <https://github.com/faisalman/ua-parser-js>
- Recorded version: `2.0.10`
- Copyright: Faisal Salman and contributors
- License: GNU Affero General Public License version 3 or later

UAParser.js is installed as a runtime dependency and is not copied into this repository.

## Snowplow referer-parser database

- Source: <https://github.com/snowplow-referer-parser/referer-parser>
- Recorded schema: `5.3`
- Recorded snapshot: `2026-08-27`
- License: GNU General Public License version 3

The bundled generated referrer map contains data from Snowplow's reusable referer database.
Snowplow documents that the database is based on Matomo's `SearchEngines.php` and `Socials.php`,
copyright 2012 Matthieu Aubry, available under GPLv3.

The full AGPL license text is included in `LICENSE`. A copy of GPLv3 is included in
`LICENSES/GPL-3.0.txt`. Snowplow's corresponding source and attribution history are available from
the source link above.
