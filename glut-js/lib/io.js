module.exports = (function() {
  'use strict';

  var openInputString = function(s) {
    var pos = 0;
    var len = s.length;
    var read = function() {
      if (pos === len) return null;
      return s[pos++];
    };

    return {
      read: read
    };
  };

  var openOutputString = function() {
    var _output = "";
    var output = function() {
      return _output;
    };
    var write = function(s) {
      _output += s;
    };

    return {
      output: output,
      write: write
    };
  };

  return {
    openInputString: openInputString,
    openOutputString: openOutputString
  };
}());
