# Design notes

FireUp should feel like a small Firefox utility for someone with too many tabs open. The tab list is the main part of the panel; controls should help people work through it without taking over the screen.

Keep counts on a short line and put settings on a separate page. The popup is at most 600 pixels tall, with the list scrolling inside it. Loading, empty results, errors and queue progress need clear states.

Use system fonts and the user's choice of system, light or dark theme. Neutral surfaces keep the list readable. Blue marks the main action and enabled protection. Controls use four-pixel corners to stay compact and recognizable.

The unload button should say what it will affect and show the candidate count. Search and filters change the list, so explain when hidden tabs are still part of an action. Keep keyboard focus useful when rows disappear or protection changes.

Keep the existing icon. Slogans, decorative animation, marketing counters and external illustrations don't help someone manage their tabs and don't belong in the panel.
