# Third-party assets

All bundled assets are public domain or openly licensed, and are served locally so the
app works offline and makes no third-party requests at runtime.

| Asset | Path | Source | Licence |
| --- | --- | --- | --- |
| 52 playing-card faces + 2 jokers (SVG) | `public/imgs/deck/*.svg` | [notpeter/Vector-Playing-Cards](https://github.com/notpeter/Vector-Playing-Cards), derived from Byron Knoll's *vector-playing-cards* | Public domain / WTFPL |
| Card back | `public/imgs/deck/back.svg` | Drawn for this project | Project-owned |
| Player avatars (12 portraits) | `public/avatars/*.svg` | [DiceBear](https://dicebear.com) "Notionists Neutral" by Zoish | CC0 1.0 |
| Outfit variable font | `public/fonts/outfit-*.woff2` | [Google Fonts — Outfit](https://fonts.google.com/specimen/Outfit) | SIL Open Font Licence 1.1 |
| UI icon set | npm `lucide-react` | [Lucide](https://lucide.dev) | ISC |

## Notes

- Joker mapping: `Joker1.svg` (black) is **So**, `Joker2.svg` (red) is **Ta**.
- Card filenames use real ranks (`QS.svg`, `10H.svg`). `src/components/Card.tsx` maps the
  game's internal rank order (1 = 3 … 12 = A, 13 = 2) onto those names.
- Avatars are picked deterministically from the username by `src/components/ui/Avatar.tsx`,
  so a player keeps the same face. A real uploaded avatar always takes priority.
- The previous raster card images in `public/imgs/cards/` are no longer referenced by the
  app and can be deleted.
