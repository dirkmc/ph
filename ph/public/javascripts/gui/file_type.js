define(function(require, exports, module) {

var CppMode = require('ace/mode/c_cpp').Mode;
var GroovyMode = require('ace/mode/groovy').Mode;
var JavaMode = require('ace/mode/java').Mode;
var JavaScriptMode = require('ace/mode/javascript').Mode;
var JsonMode = require('ace/mode/json').Mode;
var PerlMode = require('ace/mode/perl').Mode;
var PhpMode = require('ace/mode/php').Mode;
var PythonMode = require('ace/mode/python').Mode;
var RubyMode = require('ace/mode/ruby').Mode;
var SvgMode = require('ace/mode/svg').Mode;
var TextileMode = require('ace/mode/textile').Mode;
var ScalaMode = require('ace/mode/scala').Mode;
var CssMode = require('ace/mode/css').Mode;
var HtmlMode = require('ace/mode/html').Mode;
var XmlMode = require('ace/mode/xml').Mode;

var settings = {
    cpp: {
        nameRegexp: /\.(c|cpp)$/i,
        mode: CppMode
    },
    css: {
        nameRegexp: /\.(css|less)$/i,
        mode: CssMode
    },
    groovy: {
        nameRegexp: /\.groovy$/i,
        mode: GroovyMode
    },
    html: {
        nameRegexp: /\.(html)$/i,
        mode: HtmlMode
    },
    java: {
        nameRegexp: /\.java$/i,
        mode: JavaMode,
        compile: true
    },
    javaScript: {
        nameRegexp: /\.js$/i,
        mode: JavaScriptMode
    },
    json: {
        nameRegexp: /\.json$/i,
        mode: JsonMode
    },
    perl: {
        nameRegexp: /\.(pl|perl)/i,
        mode: PerlMode
    },
    php: {
        nameRegexp: /\.php$/i,
        mode: PhpMode
    },
    python: {
        nameRegexp: /\.py$/i,
        mode: PythonMode
    },
    ruby: {
        nameRegexp: /\.rb$/i,
        mode: RubyMode
    },
    scala: {
        nameRegexp: /\.scala$/i,
        mode: ScalaMode,
        compile: true
    },
    svg: {
        nameRegexp: /\.svg$/i,
        mode: SvgMode
    },
    textile: {
        nameRegexp: /\.textile$/i,
        mode: TextileMode
    },
    xml: {
        nameRegexp: /\.xml$/i,
        mode: XmlMode,
        match: function(content) {
            return content.match(/^\s*<\?xml.*\?>/);
        }
    }
};

var FileType = function(filePath, content) {
    this.filePath = filePath;
    this.content = content;
};

(function(){

    this.findSettings = function(filePath, content) {
        // First try to match against file name
        for(var lang in settings) {
            if(filePath.match(settings[lang].nameRegexp)) {
                return settings[lang];
            }
        }
        
        // Then try the match function for each file type
        for(var lang in settings) {
            if(settings[lang].match && settings[lang].match(content)) {
                return settings[lang];
            }
        }
        
        return null;
    }
    
    this.getSettings = function() {
        if(typeof this.fileSettings == 'undefined') {
            this.fileSettings = this.findSettings(this.filePath, this.content);
            this.content = null; // Free up some memory
        }
        
        return this.fileSettings;
    }

}).call(FileType.prototype);


exports.FileType = FileType;
});
