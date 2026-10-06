# Hebrew Date

A small, private-by-design browser app for Hebrew calendar anniversaries and Yahrzeits. Pick a Hebrew day and month, name your event, choose a starting Hebrew year, and download an `.ics` file. Defaults to 18 annual repetitions.

- Annual date, Birthday and Yahrzeit modes, with a live, paginated preview.
- Light/dark themes; follows the system by default, remembers manual overrides.
- No server, API calls, analytics, accounts, or external fonts. Works offline once loaded.
- Mobile layout and accessible form labels, keyboard focus, and validation.
- Credit links to https://linkedin.com/in/nroize.
- Installable on iPhone/iPad and Android, with a custom calendar icon and a clear save-app guide.
- Offline app shell, scoped per repository so other apps on the same GitHub Pages domain keep their own caches.

## Use locally

The ready-to-host app is in `dist/`. You can open `dist/index.html` directly in a browser, or run:

```sh
npm ci
npm test
npm run build
npm start
```

Preview at http://127.0.0.1:4173.

## Host on GitHub Pages

Place this project's files at the root of a GitHub repository, including the `.github` folder. In **Settings → Pages → Build and deployment**, select **GitHub Actions**. Push to `main` or run the included **Deploy GitHub Pages** workflow. It tests and builds the app, then publishes `dist/`.

A repository named `YOUR_USERNAME.github.io` serves at `https://YOUR_USERNAME.github.io/`. Another repository serves at `https://YOUR_USERNAME.github.io/REPOSITORY_NAME/`. All asset paths are relative, so either works. To add this app to an existing Pages site, copy the contents of `dist/` into a subdirectory instead of replacing that site's repository or deployment workflow.

Alternatively, publish the contents of `dist/` using Pages' branch-based deployment. The static ZIP contains those contents at its root.

## Save as a web app

Host the app over HTTPS (GitHub Pages provides this). The **Save app** invitation appears only on phones, using the browser’s mobile-device signal or phone user agent. It stays hidden on desktop and tablet browsers, even in a narrow window. On a phone, tap **Save app** for the device-specific instructions. On iPhone/iPad, open in Safari, use **Share → Add to Home Screen**, keep **Open as Web App** enabled if shown, and tap **Add**. On Android, open in Chrome and use **Add to Home screen → Install** or **Install app**. Where Chrome/Edge offers a native install prompt, the guide also shows an **Install Hebrew Date** button. Native prompts are controlled by the browser and may not appear immediately.

The phone steps follow [Apple’s Safari guide](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios) and [Google’s Chrome guide](https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid&hl=en).

The installed app opens in its own window. The install invitation is hidden when launched in standalone mode. Once the offline status says it is ready, the form, preview, and calendar export can work without a connection. The browser may eventually evict cached assets. Generated dates remain in memory; installing does not store event names or personal dates.

Installation and offline caching require HTTPS or a localhost preview; they do not work from a `file://` URL. Each build fingerprints the app shell for cache updates. A new release becomes available on the next launch after its service worker downloads successfully; an open form is not interrupted by a forced reload.

Manifest and service worker paths are relative, so the app works at a GitHub Pages root or repository subdirectory. Icons include regular 192/512px PNGs, a 512px maskable Android icon, a 180px Apple touch icon, and the editable vector in `src/icons/logo.svg`. The calendar drawing is kept inside the maskable safe area.

## Calendar behavior

The file contains one all-day event per Hebrew anniversary. It deliberately does not use a Gregorian yearly RRULE. Import it using your calendar app's import command. It is a finite set of dates, not a subscription; generate more dates if you need to extend it. Calendar clients differ in how they handle re-imports; stable event IDs are included, but repeated imports may still create duplicates.

The daytime Gregorian date is used. Hebrew days begin at sunset the previous evening. The optional preceding-evening setting creates a two-day all-day event and does not calculate a location-specific sunset time.

In **Annual date** mode, Adar maps to Adar II in leap years, while explicit Adar I/II map to Adar in common years. For a missing 30th, choose the 29th of the same month, the 1st of the next month, or skip that year. Skips do not count toward the requested number of repetitions.

In **Birthday** mode, enter the original Hebrew birth year. Births in ordinary Adar or Adar II repeat in Adar II during leap years; births in Adar I repeat in Adar I during leap years and Adar in ordinary years. Missing 30ths move forward to the 1st of the following month, including 30 Adar I becoming 1 Nisan in ordinary years. A leap birth year requires choosing Adar I or II explicitly. The starting year must be on or after the birth year. If the start equals the birth year, that date is included. Birthday and Yahrzeit modes keep separate original-year inputs when switching between modes.

In **Yahrzeit** mode, enter the actual original Hebrew year. Hebcal's `yahrzeit()` handles Adar and first-anniversary precedent for the 30th of Cheshvan/Kislev. Review the results against your custom. This mode requires a valid original Hebrew date and starts after the year of death.

Repetitions may span thousands of years. Export must fit within iCalendar's four-digit civil years (0001–9999); ranges exceeding that format limit are rejected with an explanation. Old civil dates use the proleptic Gregorian calendar.

## Source and license

GPL-2.0-only, including the bundled @hebcal/hdate dependency. See `LICENSE` and `THIRD-PARTY-NOTICES.md`. The ready-to-host folder includes `source.zip` with the complete app source and the exact library's upstream TypeScript source, also present in `vendor/hdate`. Calendar library: https://github.com/hebcal/hdate-js. Documentation: https://hebcal.github.io/api/hdate/. Calendar file formatting follows RFC 5545: https://www.rfc-editor.org/rfc/rfc5545.
