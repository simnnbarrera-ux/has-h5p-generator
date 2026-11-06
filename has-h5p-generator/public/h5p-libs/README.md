# H5P runtime libraries

The H5P standalone viewer loads the JavaScript and CSS files listed by each library's `library.json` from this directory. Keep those files in the repository, including files under `dist/`; the repository-level `.gitignore` explicitly exempts these runtime assets.

The missing preloaded bundles were restored from the official H5P Content Type Hub package for Course Presentation (`https://hub-api.h5p.org/v1/content-types/H5P.CoursePresentation`). Each extracted library's `machineName`, `majorVersion`, and `minorVersion` was checked against the matching local `library.json`; only missing preloaded JavaScript/CSS files were copied. Existing library manifests and package content were not replaced.

The regression test `src/lib/h5p-library-assets.test.ts` verifies that every declared preloaded JavaScript and CSS file exists before a change can pass the test suite. When updating a library, preserve its metadata and license notices, and keep the runtime asset version compatible with its `library.json`.
