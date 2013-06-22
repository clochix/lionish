//jshint browser: true
/*global self: true */
var urlInput = document.getElementById("url"),
    extractInput = document.getElementById("extract"),
    translateInput = document.getElementById("translate");
extractInput.addEventListener('click', function onExtract() {
  "use strict";
  self.port.emit("extract");
});
translateInput.addEventListener('click', function onTranslate() {
  "use strict";
  self.port.emit("translate", urlInput.value);
});
self.port.on("extracted", function (content) {
  "use strict";
  var pre = document.getElementById("extracted");
  pre.innerHTML = content;
  pre.style.display = "block";
});
self.port.on('l10n', function (data) {
  "use strict";
  extractInput.setAttribute("value", data.extract);
  translateInput.setAttribute("value", data.translate);
});
