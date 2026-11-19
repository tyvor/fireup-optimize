# Design notes

FireUp should feel like a small Firefox utility for someone with too many tabs open. The tab list is the main part of the panel; controls should help people work through it without taking over the screen.

The popup starts with loaded and sleeping counts, an autosleep control and a collapsible tab list. Its body stays 520 pixels tall while loading or toggling sections. The counters switch to smaller cards when the list opens, leaving more room for its scrolling area. Settings use an autosleep section and collapsible site protection, appearance and transfer sections. Outline icons reinforce the labels in both screens.

The popup prefers a 400-pixel body and has a 320-pixel minimum. The lower bound keeps its loading UI from collapsing while Firefox is measuring the popup.

Use system fonts and the user's choice of system, light or dark theme. Neutral surfaces keep the list readable. Blue marks the main action and enabled protection. Controls use four-pixel corners to stay compact and recognizable.

The unload button should say what it will affect and show the candidate count. Search and filters change the list, so explain when hidden tabs are still part of an action. Keep keyboard focus useful when rows disappear or protection changes.

Keep the existing icon. Slogans, decorative animation, marketing counters and external illustrations don't help someone manage their tabs and don't belong in the panel.
