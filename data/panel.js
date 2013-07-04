//jshint browser: true
/*global self: true */
var urlInput       = document.getElementById("url"),
    extractInput   = document.getElementById("extract"),
    translateInput = document.getElementById("translate"),
    autoInput      = document.getElementById("auto"),
    fromInput      = document.getElementById("from"),
    toInput        = document.getElementById("to"),
    pre            = document.getElementById("extracted");
extractInput.addEventListener('click', function onExtract() {
  "use strict";
  self.port.emit("extract");
});
translateInput.addEventListener('click', function onTranslate() {
  "use strict";
  self.port.emit("translate", urlInput.value, pre.value);
});
autoInput.addEventListener('click', function onAuto() {
  "use strict";
  self.port.emit("auto", urlInput.value, pre.value, fromInput.value, toInput.value);
});
self.port.on("extracted", function (content) {
  "use strict";
  pre.value = content;
  pre.style.display = "block";
});
self.port.on('l10n', function (data) {
  "use strict";
  extractInput.setAttribute("value", data.extract);
  translateInput.setAttribute("value", data.translate);
  autoInput.setAttribute("value", data.auto);
});
