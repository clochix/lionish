/*jshint devel: true */
/*global require: true */
var data = require("sdk/self").data,
    _    = require("sdk/l10n").get,
    panel;

/**
 * Trim a string
 *
 * @param {String} str
 *
 * @return {String}
 */
function trim(str) {
  "use strict";
  return str.replace(/^\s*/gm, '').replace(/\s*$/gm, '');
}

/**
 * Parse a string using po-like syntax
 *
 * @param {String} poContent the string.
 *
 * @return {Object} original ⇒ translated.
 */
function parsePo(poContent) {
  "use strict";
  var datas = {}, re1, matches;
  re1 = new RegExp('^msgid\\s*"[^"]+"[\\s\\S]{1,2}msgstr\\s*"[^"]*"', 'gym');
  matches = poContent.match(re1);
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
  }
  return datas;
}
/**
 * Translate current page
 *
 * @param {String} poContent the string.
 */
function translate(poContent) {
  "use strict";
  var datas = parsePo(poContent),
      worker;
  worker = require("sdk/tabs").activeTab.attach({
    contentScriptFile: data.url("translate.js")
  });
  worker.port.emit('translate', datas);
}
/**
 * Call a remote service to translate all strings
 *
 * After translation, emit extracted
 *
 * @param {String} raw  a po-like formatted string.
 * @param {String} from source lang.
 * @param {String} to   dest lang.
 */
function auto(raw, from, to) {
  "use strict";
  var datas, text = '';
  datas = parsePo(raw);
  text = Object.keys(datas);
  require("sdk/request").Request({
    url: 'https://translate.yandex.net/api/v1.5/tr.json/translate',
    content: {
      key: require('sdk/simple-prefs').prefs.APIKey,
      lang: from + '-' + to,
      text: text.join('|')
    },
    onComplete: function (response) {
      var res = JSON.parse(response.text),
      i   = 0,
      translated = '';
      if (res.code === 200) {
        translated = '#\n# Translation of ' + require("sdk/tabs").activeTab.url + "\n#\n\n\n";
        res.text[0].split('|').forEach(function (tr) {
          translated += '#\n' + 'msgid "' + text[i++] + '"\nmsgstr "' + tr + '"\n\n';
        });
        panel.port.emit("extracted", translated);
      } else {
        console.log("Auto translate error: " + response.text);
      }

    }
  }).post();
}
panel = require("sdk/panel").Panel({
  width: 400,
  height: 400,
  contentURL: data.url("panel.html"),
  contentScriptFile: data.url("panel.js"),
  onShow: function () {
    "use strict";
    panel.port.emit('l10n', {
      "extract": _('extract'),
      "translate": _('translate'),
      "auto": _('auto')
    });
  }
});
require("sdk/widget").Widget({
  label: "Translate",
  id: "text-entry",
  contentURL: "http://clochix.net/favicon.ico",
  panel: panel
});
panel.port.on("extract", function () {
  "use strict";
  var res,
      tab,
      worker;
  tab    = require("sdk/tabs").activeTab;
  worker = tab.attach({
    contentScriptFile: data.url("translate.js")
  });
  worker.port.emit('extract');
  worker.port.on("extracted", function (content) {
    res = '#\n# Translation of ' + tab.url + "\n#\n\n\n";
    content.forEach(function (value) {
      res += '#\n' + 'msgid "' + value + '"\nmsgstr ""\n\n';
    });
    panel.port.emit("extracted", res);
  });
});

panel.port.on("translate", function (url, raw) {
  "use strict";
  if (typeof url === 'string' && trim(url) !== '') {
    require("sdk/request").Request({
      url: url,
      onComplete: function (response) {
        translate(response.text);
      }
    }).get();
  } else if (typeof raw === 'string' && trim(raw) !== '') {
    translate(raw);
  }
  panel.hide();
});

panel.port.on("auto", function (url, raw, from, to) {
  "use strict";
  if (typeof url === 'string' && trim(url) !== '') {
    require("sdk/request").Request({
      url: url,
      onComplete: function (response) {
        auto(response.text, from, to);
      }
    }).get();
  } else if (typeof raw === 'string' && trim(raw) !== '') {
    auto(raw, from, to);
  }
});
