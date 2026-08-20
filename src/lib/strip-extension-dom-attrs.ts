/**
 * Browser extensions (password managers, etc.) inject attributes like
 * `bis_skin_checked` into the DOM before React hydrates. That triggers a
 * hydration mismatch and Next.js surfaces it as a loud bottom-of-page error.
 * Strip those attrs before Interactive so SSR HTML matches the client DOM.
 */
export const STRIP_EXTENSION_DOM_ATTRS_SCRIPT = `
(function () {
  function isExtensionAttr(name) {
    return (
      name === "bis_skin_checked" ||
      name === "bis_register" ||
      name === "cz-shortcut-listen" ||
      name.indexOf("__processed_") === 0
    );
  }
  function stripNode(node) {
    if (!node || node.nodeType !== 1 || !node.attributes) return;
    for (var i = node.attributes.length - 1; i >= 0; i--) {
      var name = node.attributes[i].name;
      if (isExtensionAttr(name)) node.removeAttribute(name);
    }
  }
  function stripTree(root) {
    stripNode(root);
    if (!root || !root.querySelectorAll) return;
    var all = root.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) stripNode(all[i]);
  }
  stripTree(document.documentElement);
  var obs = new MutationObserver(function (records) {
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      if (r.type === "attributes" && r.attributeName && isExtensionAttr(r.attributeName)) {
        r.target.removeAttribute(r.attributeName);
      } else if (r.type === "childList") {
        for (var j = 0; j < r.addedNodes.length; j++) stripTree(r.addedNodes[j]);
      }
    }
  });
  obs.observe(document.documentElement, {
    attributes: true,
    childList: true,
    subtree: true,
  });
  function stop() {
    try {
      obs.disconnect();
    } catch (e) {}
  }
  window.addEventListener("DOMContentLoaded", function () {
    setTimeout(stop, 2500);
  });
  setTimeout(stop, 8000);
})();
`.trim();
