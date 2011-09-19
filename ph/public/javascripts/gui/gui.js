define(function(require, exports, module) {

var ace = require("ace/ace");
var canon = require("pilot/canon");
var ServerInterface = require("gui/server").ServerInterface;
var RecentView = require('gui/views/recent').RecentView;
var ProjectView = require('gui/views/project').ProjectView;
var AutoCompleteWidget = require('gui/widgets/auto_complete').AutoCompleteWidget;
var ErrorReporterWidget = require('gui/widgets/error_reporter').ErrorReporterWidget;
var ScalaMode = require('ace/mode/scala').Mode;
var CssMode = require('ace/mode/css').Mode;
var HtmlMode = require('ace/mode/html').Mode;
var XmlMode = require('ace/mode/xml').Mode;

var fileTypes = {
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
    
function getFileType(fileName, content) {
    // First try to match against file name
    for(var lang in fileTypes) {
        if(fileName.match(fileTypes[lang].nameRegexp)) {
            return fileTypes[lang];
        }
    }
    
    // Then try the match function for each file type
    for(var lang in fileTypes) {
        if(fileTypes[lang].match && fileTypes[lang].match(content)) {
            return fileTypes[lang];
        }
    }
    
    return null;
}

function Editor(fileName, editorPane, editorTab, initialContent) {
    var _self = this;
    this.editorPane = editorPane;
    this.editorTab = editorTab;
    this.fileName = fileName;
    
    this.editor = ace.edit(editorPane[0]);
    this.editor.setTheme("ace/theme/eclipse");
    this.autoComplete = new AutoCompleteWidget(this);
    this.errorReporter = new ErrorReporterWidget(this);
    
    var doc = this.editor.getSession().getDocument();
    
    this.serverInterface = new ServerInterface({
        fileName: fileName,
        newLine: doc.getNewLineCharacter(),
        onCompile: function(msgs) {
            _self.editor.getSession().setAnnotations(msgs);
            _self.errorReporter.setErrors(msgs);
        },
        editor: this
    });
    
    this.autoCompleteTimeout = null;
    doc.on("change", function(e) {
        _self.serverInterface.addDelta(e.data);
    });
    
    var fileType = getFileType(fileName, initialContent);
    if(fileType) {
        this.editor.getSession().setMode(new fileType.mode());
        if(fileType.compile) {
            this.serverInterface.compile();
        }
    }
    
    this.saveFile = function() {
        _self.serverInterface.saveFile(_self.editor.getSession().getDocument().getValue());
    };
}

function EditorQueue() {
    this.queue = [];
    
    this.remove = function(editor) {
        for(var i = 0; i < this.queue.length; i++) {
            if(editor == this.queue[i]) {
                this.queue.splice(i, 1);
                return;
            }
        }
    }
    
    this.peek = function() {
        return this.queue[this.queue.length - 1];
    }
    
    this.push = function(editor) {
        this.remove(editor);
        this.queue.push(editor);
    }
}

function LeftPane() {
    this.views = {};
    
    this.add = function(viewName, view) {
        this.views[viewName] = view;
        $('#left-pane').append(view.getWindow());
    }
    
    this.show = function(viewName) {
        for(var winViewName in this.views) {
            var win = this.views[winViewName].getWindow();
            win.css('z-index', viewName == winViewName ? 10 : 0);
        }
        
        this.views[viewName].show &&
        this.views[viewName].show();
    }
}

var Gui = function() {
    this.editors = {};
    this.editorQueue = new EditorQueue();
    
    this.leftPane = new LeftPane();
    this.leftPane.add("project", new ProjectView(this));
    this.leftPane.add("recent", new RecentView(this));
    this.leftPane.show("project");
    
    this.initCommands();
    //this.loadEditor('/Users/dirk/dev/projects/yabe/app/controllers.scala');
};

(function(){

    this.loadEditor = function(fileName) {
        var editor = this.editors[fileName];
        
        // Still loading the editor
        if(editor === false) {
            return;
        }
        
        if(editor != null) {
            this.showEditor(editor);
        } else {
            // Editor has not yet been created, so create it
            this.editors[fileName] = false;
            var _self = this;
            $.ajax({
                url: '/file/load',
                data: { filePath: fileName },
                success: function(content) {
                    _self.openEditor(fileName, content);
                }
            })
        }
    };
    
    this.openEditor = function(fileName, content) {
        var editorContainer = $('#editor-container');
        var tabsContainer = $('#tab-container');
        
        var editorPane = $('<pre class="editor-pane"></pre>');
        editorPane.text(content);
        editorContainer.append(editorPane);
        
        var shortName = fileName.substring(fileName.lastIndexOf('/') + 1);
        var tabHtml = '<div class="editor-tab">';
        tabHtml += '<span class="editor-name">';
        tabHtml += shortName;
        tabHtml += '</span>';
        tabHtml += '<span class="editor-close">&nbsp;</span>';
        tabHtml += '</div>';
        var editorTab = $(tabHtml);
        tabsContainer.append(editorTab);
        var that = this;
        editorTab.find('.editor-name').click(function() {
            that.showEditor($(this).parent().data('editor'));
        });
        editorTab.find('.editor-close').click(function() {
            that.closeEditor($(this).parent().data('editor'));
        });
        
        var editor = new Editor(fileName, editorPane, editorTab, content);
        editorTab.data('editor', editor);
        this.editors[fileName] = editor;
        this.showEditor(editor);
    };
    
    this.showEditor = function(editor) {
        if(editor == null) {
            document.title = '';
            return;
        }
        this.editorQueue.push(editor);
        var tabsContainer = $('#tab-container');
        tabsContainer.children().removeClass('selected');
        editor.editorTab.addClass('selected');
        
        var editorContainer = $('#editor-container');
        editorContainer.children().hide();
        editor.editorPane.show();
        
        document.title = editor.fileName;
    };
    
    this.closeEditor = function(editor) {
        editor.editorPane.remove();
        editor.editorTab.remove();
        this.editors[editor.fileName] = null;
        this.editorQueue.remove(editor);
        this.showEditor(this.editorQueue.peek());
    };
    
    this.getProjectRoot = function() {
        return '/Users/dirk/dev/projects/yabe';
    };
    
    this.initCommands = function() {
        var _self = this;
        canon.addCommand({
            name: "save",
            bindKey: {
                win: "Ctrl-S",
                mac: "Command-S",
                sender: "editor"
            },
            exec: function(env, args, request) {
                var currentEditor = _self.editorQueue.peek();
                currentEditor && currentEditor.saveFile();
            }
        });
        
        canon.addCommand({
            name: "show-recent",
            bindKey: {
                win: "Ctrl-Shift-R",
                mac: "Command-Shift-R",
                sender: "editor"
            },
            exec: function(env, args, request) {
                _self.leftPane.show('recent');
            }
        });
        
        canon.addCommand({
            name: "show-project",
            bindKey: {
                win: "Ctrl-Shift-N",
                mac: "Command-Shift-N",
                sender: "editor"
            },
            exec: function(env, args, request) {
                _self.leftPane.show('project');
            }
        });
    };
    
}).call(Gui.prototype);


exports.Gui = Gui;
});
