//jshint browser: true, devel: true
/*global self: true */
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
 * Translate a value
 * If source and destination masks contains %%, the matching words from value will be preserved
 *
 * @param {String} val value to translate.
 * @param {String} src source mask.
 * @param {String} dst dest mask.
 *
 * @return {String} translated string.
 */
function _(val, src, dst) {
  "use strict";
  if (/%%/gm.test(src)) {
    var re = new RegExp(src.replace(/%%/gm, '(.*)')),
    matches = val.match(re).slice(1),
    i = 0;
    return dst.replace(/%%/gm, function () { return matches[i++]; });
  } else {
    return dst;
  }
}
/**
 * Get a snapshot of all text nodes
 *
 * @return {Array} Snapshot of all text nodes.
 */
function getStrings() {
  "use strict";
  return document.evaluate("//text()", document.body, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
}
/**
 * Extract all strings from current page
 *
 * @return {Array} Array of all text strings.
 */
function extract() {
  //jshint maxdepth: 5, maxcomplexity: 15, maxstatements: 30
  "use strict";
  var snapshot = getStrings(),
      node, tag, res, i, reg;
  res = {};
  reg = new RegExp(['\\?', ',', '\\.', ';', ':', '!', '\\d', '\\(', '\\)', '\\[', '\\]', '\\+', '\\-'].join('|'), 'gim');
  function addValue(val) {
    val = trim(val);
    if (val !== '' && trim(val.replace(reg, '')) !== '') {
      res[val.replace(/\d+/g, "%%")] = true;
    }
  }
  for (i = 0 ; i < snapshot.snapshotLength; i++) {
    node = snapshot.snapshotItem(i);
    tag = node.parentElement.tagName;
    if (tag !== 'SCRIPT' && tag !== 'STYLE' && tag !== 'NOSCRIPT') {
      addValue(node.nodeValue);
    }
  }
  Array.prototype.forEach.call(document.querySelectorAll('[alt],[placeholder][title]'), function onElement(e) {
    if (e.alt) {
      addValue(e.alt);
    }
    if (e.placeholder) {
      addValue(e.placeholder);
    }
    if (e.title) {
      addValue(e.title);
    }
  });
  return Object.keys(res);
}
/**
 * Translate strings
 *
 * @param {Object} datas  dictionnary.
 */
function translate(datas) {
  //jshint maxdepth: 5, maxcomplexity: 15, maxstatements: 30
  "use strict";
  var snapshot = getStrings(),
      node, tag, value, translated, i, trimmed, reg;
  reg = new RegExp(['\\?', ',', '\\.', ';', ':', '!', '\\d', '\\(', '\\)', '\\[', '\\]', '\\+', '\\-'].join('|'), 'gim');
  function trVal(val) {
    var res = false;
    val = trim(val);
    if (val !== '' && trim(val.replace(reg, '')) !== '') {
      translated = datas[val];
      if (typeof translated === 'string' && trim(translated) !== '') {
        trimmed = node.nodeValue.match(/(^\s*)\S.*\S(\s*)$/);
        if (trimmed !== null) {
          res = trimmed[1] + _(translated, val, translated) + trimmed[2];
        }
      } else {
        console.log("No translation found for \"" + val + "\"");
      }
    }
    return res;
  }
  for (i = 0 ; i < snapshot.snapshotLength; i++) {
    node = snapshot.snapshotItem(i);
    tag = node.parentElement.tagName;
    if (tag !== 'SCRIPT' && tag !== 'STYLE') {
      value = trVal(node.nodeValue);
      if (value) {
        node.nodeValue = value;
      }
    }
  }
  Array.prototype.forEach.call(document.querySelectorAll('[alt],[placeholder],[title]'), function onElement(e) {
    if (e.alt) {
      value = trVal(e.alt);
      if (value) {
        e.alt = value;
      }
    }
    if (e.placeholder) {
      value = trVal(e.title);
      if (value) {
        e.placeholder = value;
      }
    }
    if (e.title) {
      value = trVal(e.title);
      if (value) {
        e.title = value;
      }
    }
  });
}

self.port.on('extract', function doExtract() {
  "use strict";
  var extracted;
  extracted = extract();
  self.port.emit('extracted', extracted);
});
self.port.on('translate', function doTranslate(datas) {
  "use strict";
  translate(datas);
});
