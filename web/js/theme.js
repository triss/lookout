/* Theme application — low-glare default + user choice.
   ES5, no modules, no dependencies, so it runs on the same old browsers the
   capability checker targets. Loaded from <head>: it applies the saved theme
   synchronously (before paint, no flash), then binds an explicit settings
   select if the page provides one.

   Themes: "system" (follow prefers-color-scheme; light default is beige),
   "dark", "beige", "blue". Persisted in localStorage. */
(function () {
  "use strict";
  var KEY = "lookout-theme";
  var THEMES = ["system", "dark", "beige", "blue"];

  function read() {
    try {
      var v = localStorage.getItem(KEY);
      return THEMES.indexOf(v) >= 0 ? v : "system";
    } catch (e) { return "system"; }
  }

  function apply(t) {
    var el = document.documentElement;
    if (t && t !== "system") el.setAttribute("data-theme", t);
    else el.removeAttribute("data-theme");
  }

  // Apply immediately — documentElement exists while the <head> script runs.
  apply(read());

  function bindSelect(select) {
    function update() {
      try { localStorage.setItem(KEY, select.value); } catch (e) {}
      apply(select.value);
    }
    select.value = read();
    select.addEventListener("input", update);
    select.addEventListener("change", update);
    apply(select.value);
  }

  function bindSettingsThemeSelect() {
    var existing = document.getElementById("themeSelect");
    if (existing) {
      bindSelect(existing);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindSettingsThemeSelect);
  } else {
    bindSettingsThemeSelect();
  }
})();
