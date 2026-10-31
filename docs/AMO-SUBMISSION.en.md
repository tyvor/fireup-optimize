# Mozilla submission text for 0.4.2

Copy the version notes into the release-notes field. The reviewer note is for the private notes field, not the public description. The existing listing description can stay as it is.

## Version notes

- Fixed timing issues that could override newly assigned or renewed tab protection.
- Clarified what manual unloading affects, including when search and filters hide tabs.
- Reduced repeated full-tab queries during automatic unloading.
- Reduced queue checkpoint copying and avoided unnecessary session writes.
- Added a minimum popup width to prevent the panel from collapsing during startup. Normal opening has been confirmed manually in Firefox.
- Added regression tests for working-set updates, queue recovery and popup sizing.

## Notes for reviewers

FireUp 0.4.2 is a desktop Firefox extension. It needs no account, payment or external service, and adds no permissions in this update.

The package contains readable JavaScript, HTML and CSS. There is no compilation, bundling, minification, obfuscation or downloaded code. Packaging only ZIPs the extension directory with manifest.json at the archive root. npm dependencies are used for development checks, not by the installed extension.

Tab information is processed locally. There is no analytics, advertising or server component. The manifest declares no required data collection.

To test, open several disposable tabs, keep one active and protect one background tab. Run a manual unload from the panel. The active and protected tabs should stay loaded; unloaded tabs should reload when selected. No test credentials are needed. Protect unsaved forms and editors before unloading.

The maintainer manually checked 0.4.2 in Firefox and confirmed normal popup opening. Automated checks pass: 79 Node tests, 21 Chromium UI/language scenarios and four startup language/theme combinations. The Chromium checks use modeled Firefox APIs; they are separate from the manual Firefox check. No measured Firefox RAM or CPU improvement is claimed.

Source: https://github.com/tyvor/fireup-optimize

Build instructions: https://github.com/tyvor/fireup-optimize/blob/main/BUILD-INSTRUCTIONS.md

Privacy: https://github.com/tyvor/fireup-optimize/blob/main/PRIVACY.md
