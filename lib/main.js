/*global require: true */
var data = require("sdk/self").data,
    _    = require("sdk/l10n").get,
    panel;

function translate(poFile) {
  "use strict";
  var datas = {};
  require("sdk/request").Request({
    url: poFile,
    onComplete: function (response) {
      var re1, matches, worker;
      re1 = new RegExp('^msgid\\s*"[^"]+"[\\s\\S]{1,2}msgstr\\s*"[^"]*"', 'gym');
      matches = response.text.match(re1);
      if (matches === null) {
        console.log('Unable to parse source');
      } else {
        matches.forEach(function (m) {
          var re2 = new RegExp('^msgid\\s*"([^"]+)"[\\s\\S]{1,2}msgstr\\s*"([^"]*)"', 'gym'),
              res = re2.exec(m);
          if (res) {
            datas[res[1]] = res[2];
          } else {
            console.log("Unable to parse " + m);
          }
        });
        worker = require("sdk/tabs").activeTab.attach({
          contentScriptFile: data.url("translate.js")
        });
        worker.port.emit('translate', datas);
      }
    }
  }).get();
}

// Construct a panel, loading its content from the "text-entry.html"
// file in the "data" directory, and loading the "get-text.js" script
// into it.
panel = require("sdk/panel").Panel({
  width: 400,
  height: 400,
  contentURL: data.url("panel.html"),
  contentScriptFile: data.url("panel.js"),
  onShow: function () {
    panel.port.emit('l10n', {
      "extract": _('extract'),
      "translate": _('translate')
    });
  }
});

// Create a widget, and attach the panel to it, so the panel is
// shown when the user clicks the widget.
require("sdk/widget").Widget({
  label: "Translate",
  id: "text-entry",
  contentURL: "http://clochix.net/favicon.ico",
  panel: panel
});

panel.port.on("extract", function () {
  "use strict";
  var worker = require("sdk/tabs").activeTab.attach({
    contentScriptFile: data.url("translate.js")
  });
  worker.port.emit('extract');
  worker.port.on("extracted", function (content) {
    panel.port.emit("extracted", content);
  });
});

panel.port.on("translate", function (url) {
  "use strict";
  translate(url);
  panel.hide();
});

