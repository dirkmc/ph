/**
 * {
 *   - newLine
 *     The newline character used in the document
 *     
 *   - fileName
 *     The file name
 *     
 *   - onCompile
 *     Function called when file has been compiled. Passes errors/warning as a
 *     parameter
 * }
 */
define(function(require, exports, module) {

var ServerInterface = function(settings) {
    this.settings = settings;
    // TODO: Make sure deltas don't get lost if one is added while the ajax call is being made
    this.deltas = [];
    this.sendTimeout = null;
};

(function(){
    
    this.addDelta = function(delta) {
        clearTimeout(this.sendTimeout);
        var _self = this;
        this.sendTimeout = setTimeout(function() { _self.sendDeltas.apply(_self); }, 1000);
        this.deltas.push(delta);
    };
    
    this.compile = function() {
        var _self = this;
        $.ajax({
            url: '/file/compile.json',
            type: 'GET',
            dataType: 'json',
            data: {
                fileName: this.settings.fileName
            },
            success: function(data) {
                _self.settings.onCompile(getCompileErrors(data))
            }
        });
    };
    
    this.saveFile = function(value) {
        // Simple checksum (Couldn't get JS CRC32 to work)
        var checksum = value.length;
        for(var c = 0; c < value.length; c++) {
            checksum = (checksum + value.charAt(c).charCodeAt()) % 2147483647;
        }
        
        $.ajax({
            url: '/file/save',
            type: 'POST',
            data: {
                fileName: this.settings.fileName,
                checksum: checksum
            }
        });
    };
    
    this.sendDeltas = function() {
        var _self = this;
        $.ajax({
            url: '/file/deltas.json',
            type: 'POST',
            dataType: 'json',
            data: {
                fileName: this.settings.fileName,
                deltas: serializeDeltas(this.settings.newLine, this.deltas),
                compileAfter: true
            },
            success: function(data) {
                _self.settings.onCompile(getCompileErrors(data))
            }
        });
        
        this.deltas = [];
    };
    
    function getCompileErrors(messages) {
        var msgs = [];
        for(var i = 0; i < messages.length; i++) {
            msgs.push({
                row: messages[i].row - 1,
                column: messages[i].column,
                text: messages[i].text,
                type: (messages[i].type == "Error" ? "error" : messages[i].type)
            });
        }
        
        return msgs;
    }

    /**
     * @return +7,12,Hi there\\nstranger\n-10,12,3\n...
     */
    function serializeDeltas(newLineChar, origDeltas) {
        var deltas = normalizeDeltas(newLineChar, origDeltas);
        
        var str = '';
        for(var i = 0; i < deltas.length; i++) {
            var delta = deltas[i];
            
            if(i > 0) {
                str += "\n";
            }
            
            if(delta.action == "insert") {
                str += "+";
                str += delta.start.column + "," + delta.start.row;
                str += "," + delta.text.replace("\n", "\\n");
            } else {
                str += "-";
                str += delta.start.column + "," + delta.start.row;
                str += "," + delta.length;
            }
        }
        
        return str;
    }

    function normalizeDeltas(newLineChar, origDeltas) {
        var deltas = [];
        for(var i = 0; i < origDeltas.length; i++) {
            var origDelta = origDeltas[i];
            
            var delta = null;
            switch(origDelta.action) {
            case "insertLines":
                delta = {
                    action: "insert",
                    start: { row: origDelta.range.start.row, column: origDelta.range.start.column },
                    text: origDelta.lines.join(newLineChar)
                }
            break;
                
            case "insertText":
                delta = {
                    action: "insert",
                    start: { row: origDelta.range.start.row, column: origDelta.range.start.column },
                    text: origDelta.text
                }
            break;
            
            case "removeLines":
                delta = {
                    action: "remove",
                    start: { row: origDelta.range.start.row, column: origDelta.range.start.column },
                    length: origDelta.lines.join(newLineChar).length
                }
            break;
            
            case "removeText":
                delta = {
                    action: "remove",
                    start: { row: origDelta.range.start.row, column: origDelta.range.start.column },
                    length: origDelta.text.length
                }
            break;
            }
            
            deltas.push(delta);
        }
        
        return deltas;
    }
    
    return {
        addDelta: this.addDelta,
        compile: this.compile,
        saveFile: this.saveFile
    };
    
}).call(ServerInterface.prototype);


exports.ServerInterface = ServerInterface;
});


/*
//01234567890123456789012345678901234
var text = "This is the first sentence\n";
text    += "Now we're on the next line.\n";
text    += "Let's add a third, and finally\n";
text    += "\n";
text    += "a blank followed by a fifth line\n";

var normalized = serializeDeltas("\n", [{
        action: "removeText",
        range: {
            start: {row: 0, column: 7},
            end: {row: 0, column: 8}
        },
        text: " "
    }, {
        action: "removeText",
        range: {
            start: {row: 0, column: 6},
            end: {row: 0, column: 7}
        },
        text: "s"
    }, {
        action: "removeLines",
        range: {
            start: {row: 1, column: 0},
            end: {row: 3, column: 0}
        },
        lines: ["Now we're on the next line.", "Let's add a third, and finally"]
    }, {
        action: "insertText",
        range: {
            start: {row: 2, column: 8},
            end: {row: 2, column: 14}
        },
        text: "white "
    }, {
        action: "insertLines",
        range: {
            start: {row: 1, column: 0},
            end: {row: 3, column: 0}
        },
        lines: ["first inserted", "second inserted"]
    }
]);

console.log(normalized);
*/
