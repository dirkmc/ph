$(function() {
    $('#files-window ul ul').hide();
    $('#files-window .directory .title').click(function() {
        $(this).parent().find('ul:first').each(function() {
            $(this).is(':visible') ? $(this).hide() : $(this).show();
        });
    });
    
    $('.file').click(function() {
        var fileName = $(this).find('input').val();
        $.ajax({
            url: '/file/load',
            data: { fileName: fileName },
            success: function(content) {
                openEditor(fileName, content);
            }
        })
    });
    
    
    
    // Ace
    var baseUrl = "/public/javascripts/ace";
    var paths = {
            ace: "lib/ace",
            pilot: "support/pilot/lib/pilot"
    };
    
    
    var editors = {};
    function openEditor(fileName, content) {
        var editor = editors[fileName];
        if(editor == null) {
            var editorContainer = $('#editor-container');
            var tabsContainer = $('#tab-container');
            
            var editorPane = $('<pre class="editor-pane">' + content + '</pre>');
            editorContainer.append(editorPane);
            
            var shortName = fileName.substring(fileName.lastIndexOf('/') + 1);
            var editorTab = $('<span class="editor-tab">' + shortName + '</span>');
            tabsContainer.append(editorTab);
            editorTab.click(function() {
                showEditor($(this).data('editor'));
            });
            
            editor = new Editor(fileName, editorPane, editorTab);
            editorTab.data('editor', editor);
            editors[fileName] = editor;
        }
        
        showEditor(editor);
    }
    
    function showEditor(editor) {
        var tabsContainer = $('#tab-container');
        tabsContainer.children().removeClass('selected');
        editor.editorTab.addClass('selected');
        
        var editorContainer = $('#editor-container');
        editorContainer.children().hide();
        editor.editorPane.show();
        
        document.title = editor.fileName;
    }
    
    
    var currentEditor = null;
    function Editor(fileName, editorPane, editorTab) {
        currentEditor = this;
        var that = this;
        
        this.fileName = fileName;
        this.editorPane = editorPane;
        this.editorTab = editorTab;
        this.editor = null;
        this.isScala = fileName.match(/.scala(.html)?$/) != null;
        this.doc = null;
        
        this.requireInit = function(ace, scala) {
            that.editor = ace.edit(editorPane[0]);
            that.editor.setTheme("ace/theme/eclipse");
            if(that.isScala) {
                var ScalaMode = scala.Mode;
                that.editor.getSession().setMode(new ScalaMode(fileName));
            }
            
            that.doc = that.editor.getSession().getDocument();
            that.doc.on("change", function(e) {
                console.log(e.data)
                addDelta(e.data);
            });
        };
        require({
                baseUrl: baseUrl,
                paths: paths
            },
            ['ace/ace', 'ace/mode/scala'],
            that.requireInit
        );
        
        // TODO: Make sure deltas don't get lost if one is added while the ajax call is being made
        this.deltas = [];
        this.sendTimeout = null;
        function addDelta(delta) {
            clearTimeout(that.sendTimeout);
            that.sendTimeout = setTimeout(sendDeltas, 1000);
            that.deltas.push(delta);
        }
        
        function sendDeltas() {
            $.ajax({
                url: '/file/deltas',
                type: 'POST',
                data: {
                    fileName: that.fileName,
                    deltas: serializeDeltas(that.doc.getNewLineCharacter(), that.deltas)
                }
            });
            
            that.deltas = [];
        }

        this.saveFile = function() {
            $.ajax({
                url: '/file/save',
                type: 'POST',
                data: {
                    fileName: that.fileName,
                    content: that.editor.getSession().getDocument().getValue()
                }
            });
        };
    }
    
    
    function initAce() {
        require({
            baseUrl: baseUrl,
            paths: paths
        },
        ['pilot/canon'],
        function(canon) {
            canon.addCommand({
                name: "save",
                bindKey: {
                    win: "Ctrl-S",
                    mac: "Command-S",
                    sender: "editor"
                },
                exec: function(env, args, request) {
                    currentEditor && currentEditor.saveFile();
                }
            });
        });
    }
    
    initAce();
});


function serializeDeltas(newLineChar, origDeltas) {
    var deltas = linesToChars(newLineChar, origDeltas);
    
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

function linesToChars(newLineChar, origDeltas) {
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