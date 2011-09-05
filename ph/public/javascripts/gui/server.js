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
    this.deltas = [];
    this.deltaTimeout = null;
    this.deltaDelay = 1000;
    this.sendQueue = [];
};

(function(){
    
    this.enqueue = function(item) {
        this.sendQueue.push(item);
        this.sendQueueItem();
    };
    
    this.sendQueueItem = function() {
        if(this.sendQueue.length == 0 || this.sending) {
            return;
        }
        this.sending = true;
        
        var _self = this;
        var queueItem = this.sendQueue.shift();
        doSend(queueItem);
        
        // Send a queue item
        function doSend(ajaxCall) {
            ajaxCall.oldComplete = ajaxCall.complete;
            ajaxCall.complete = function() {
                ajaxCall.oldComplete && ajaxCall.oldComplete(arguments);
                
                // Ajax calls can be chained together, for example if there is
                // an error with saving the deltas, another request is made to
                // POST the entire contents of the file.
                var chainItem = ajaxCall.chain ? ajaxCall.chain() : null;
                if(chainItem) {
                    doSend(chainItem);
                } else {
                    _self.sending = false;
                    
                    // Once this request is complete, call the function again
                    // to send the next item in the queue
                    setTimeout(function() { _self.sendQueueItem.apply(_self); }, 0);
                }
            };
            
            // We need to supply the original object to the error call as "this"
            // in order for chaining to work
            ajaxCall.oldError = ajaxCall.error;
            ajaxCall.error = function() {
                ajaxCall.oldError && ajaxCall.oldError.apply(ajaxCall, arguments)
            }
            
            // Call the onSend method if there is one
            ajaxCall.onSend && ajaxCall.onSend.apply(ajaxCall);
            
            $.ajax(ajaxCall);
        }
    };
    
    this.addDelta = function(delta) {
        clearTimeout(this.deltaTimeout);
        var _self = this;
        this.deltaTimeout = setTimeout(function() { _self.sendDeltas.apply(_self); }, _self.deltaDelay);
        this.enqueueDelta(delta);
    };
    
    this.forceSendDeltas = function() {
        clearTimeout(this.deltaTimeout);
        this.sendDeltas();
    };
    
    this.sendDeltas = function() {
        var deltas = this.popDeltas();
        if(deltas.length == 0) {
            return;
        }
        
        var cursorPos = this.settings.editor.editor.getCursorPosition();
        var _self = this;
        this.enqueue({
            url: '/file/deltas.json',
            type: 'POST',
            dataType: 'json',
            data: {
                filePath: this.settings.fileName,
                deltas: serializeDeltas(this.settings.newLine, deltas),
                compile: true,
                cursorRow: cursorPos.row,
                cursorColumn: cursorPos.column
            },
            onSend: function() {
                var delta = deltas[deltas.length - 1];
                this.data.autoComplete = _self.settings.editor.autoComplete.checkForAutoComplete(delta);
                this.data.compile = !this.data.autoComplete
            },
            success: function(response) {
                if(response.compile !== null && typeof response.compile != 'undefined') {
                    _self.settings.onCompile(getCompileMessages(response))
                }
                if(response.autoComplete !== null && typeof response.autoComplete != 'undefined') {
                    _self.settings.editor.autoComplete.show(response.autoComplete);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log("Error:");
                console.log(jqXHR);
                console.log(textStatus);
                console.log(errorThrown);
            }
        });
    };
    
    this.enqueueDelta = function(delta) {
        this.deltas.push(delta);
    };
    this.popDeltas = function(delta) {
        var deltas = $.extend(true, [], this.deltas);
        this.deltas = [];
        return deltas;
    };
    
    
    this.compile = function() {
        // Force the deltas to send before doing a compile
        this.forceSendDeltas();
        
        var _self = this;
        this.enqueue({
            url: '/file/compile.json',
            type: 'GET',
            dataType: 'json',
            data: {
                filePath: this.settings.fileName
            },
            success: function(response) {
                _self.settings.onCompile(getCompileMessages(response))
            }
        });
    };
    
    this.saveFile = function(value) {
        // Force the deltas to send before doing a save
        this.forceSendDeltas();
        
        // Simple checksum (Couldn't get JS CRC32 to work)
        var checkSum = value.length;
        for(var c = 0; c < value.length; c++) {
            checkSum = (checkSum + value.charAt(c).charCodeAt()) % 2147483647;
        }
        
        var _self = this;
        this.enqueue({
            chainVal: value,
            url: '/file/save.json',
            type: 'POST',
            data: {
                filePath: _self.settings.fileName,
                checkSum: checkSum
            },
            // If saving deltas fails (eg because of a bad checksum) try
            // sending the entire file as a POST
            error: function(xhr, textStatus, errorThrown) {
                if(textStatus == 'error') {
                    var response = $.parseJSON(xhr.responseText);
                    if(response && response.error == 'checksum') {
                        this.checkSumError = true;
                    }
                }
            },
            chain: function() {
                if(!this.checkSumError) {
                    return null;
                }
                return _self.getSaveFileContentQueueItem(this.chainVal);
            }
        });
    };
    
    this.saveFileContent = function(value) {
        // Force the deltas to send before doing a save
        this.forceSendDeltas();
        this.enqueue(this.getSaveFileContentQueueItem(value));
    };
    
    this.getSaveFileContentQueueItem = function(value) {
        return {
            url: '/file/save/content.json',
            type: 'POST',
            data: {
                filePath: this.settings.fileName,
                content: value
            }
        }
    }
    
    function getCompileMessages(response) {
        var messages = response.compile ? response.compile : [];
        var msgs = [];
        for(var i = 0; i < messages.length; i++) {
            msgs.push({
                row: messages[i].row - 1,
                column: messages[i].column,
                text: messages[i].text,
                type: messages[i].type
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
