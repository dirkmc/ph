define(function(require, exports, module) {

var ScalaMode = require('ace/mode/scala').Mode;
var CssMode = require('ace/mode/css').Mode;
var HtmlMode = require('ace/mode/html').Mode;
var XmlMode = require('ace/mode/xml').Mode;

var settings = {
    scala: {
        nameRegexp: /\.scala$/i,
        mode: ScalaMode,
        compile: true
    },
    css: {
        nameRegexp: /\.(css|less)$/i,
        mode: CssMode
    },
    html: {
        nameRegexp: /\.(html)$/i,
        mode: HtmlMode
    },
    xml: {
        nameRegexp: /\.(xml)$/i,
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
