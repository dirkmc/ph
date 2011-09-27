define(function(require, exports, module) {

var ace = require("ace/ace");
var canon = require("pilot/canon");
var ServerInterface = require("gui/server").ServerInterface;
var RecentView = require('gui/views/recent').RecentView;
var ProjectView = require('gui/views/project').ProjectView;
var AutoCompleteWidget = require('gui/widgets/auto_complete').AutoCompleteWidget;
var ErrorReporterWidget = require('gui/widgets/error_reporter').ErrorReporterWidget;
var FileType = require('gui/file_type').FileType;

function SourceFile(project, filePath, editorPane, editorTab, initialContent) {
    var _self = this;
    this.editorPane = editorPane;
    this.editorTab = editorTab;
    this.filePath = filePath;
    
    this.editor = ace.edit(editorPane[0]);
    this.editor.setTheme("ace/theme/eclipse");
    this.autoComplete = new AutoCompleteWidget(this);
    this.errorReporter = new ErrorReporterWidget(this);
    
    var fileType = new FileType(filePath, initialContent).getSettings();
    var doc = this.editor.getSession().getDocument();
    
    this.serverInterface = new ServerInterface({
        project: project,
        filePath: filePath,
        newLine: doc.getNewLineCharacter(),
        compile: fileType != null && fileType.compile,
        getCursorPosition: function() {
            return _self.editor.getCursorPosition();
        },
        shouldAutoComplete: function(delta) {
            return _self.autoComplete.checkForAutoComplete(delta);
        }
    });
    
    this.serverInterface.on('compile', function(e) {
        _self.editor.getSession().setAnnotations(e.messages);
        _self.errorReporter.setErrors(e.messages);
    });
    
    this.serverInterface.on('complete', function(e) {
        _self.autoComplete.show(e);
    });
    
    
    doc.on("change", function(e) {
        _self.serverInterface.addDelta(e.data);
    });
    
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

function SourceFileQueue() {
    this.queue = [];
    
    this.remove = function(sourceFile) {
        for(var i = 0; i < this.queue.length; i++) {
            if(sourceFile == this.queue[i]) {
                this.queue.splice(i, 1);
                return;
            }
        }
    }
    
    this.peek = function() {
        return this.queue[this.queue.length - 1];
    }
    
    this.push = function(sourceFile) {
        this.remove(sourceFile);
        this.queue.push(sourceFile);
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

var Gui = function(project) {
    this.project = project;
    this.sourceFiles = {};
    this.sourceFileQueue = new SourceFileQueue();
    
    this.leftPane = new LeftPane();
    this.leftPane.add("project", new ProjectView(this));
    this.leftPane.add("recent", new RecentView(this));
    this.leftPane.show("project");
    
    this.initCommands();
};

(function(){

    this.loadSourceFile = function(filePath) {
        var sourceFile = this.sourceFiles[filePath];
        
        // Still loading the sourceFile
        if(sourceFile === false) {
            return;
        }
        
        if(sourceFile != null) {
            this.showSourceFile(sourceFile);
        } else {
            // SourceFile has not yet been created, so create it
            this.sourceFiles[filePath] = false;
            var _self = this;
            $.ajax({
                url: '/file/load',
                data: { project: _self.project, filePath: filePath },
                success: function(content) {
                    _self.openSourceFile(filePath, content);
                }
            })
        }
    };
    
    this.openSourceFile = function(filePath, content) {
        var editorContainer = $('#editor-container');
        var tabsContainer = $('#tab-container');
        
        var editorPane = $('<pre class="editor-pane"></pre>');
        editorPane.text(content);
        editorContainer.append(editorPane);
        
        var shortName = filePath.substring(filePath.lastIndexOf('/') + 1);
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
            that.showSourceFile($(this).parent().data('sourceFile'));
        });
        editorTab.find('.editor-close').click(function() {
            that.closeSourceFile($(this).parent().data('sourceFile'));
        });
        
        var sourceFile = new SourceFile(this.project, filePath, editorPane, editorTab, content);
        editorTab.data('sourceFile', sourceFile);
        this.sourceFiles[filePath] = sourceFile;
        this.showSourceFile(sourceFile);
    };
    
    this.showSourceFile = function(sourceFile) {
        if(sourceFile == null) {
            document.title = '';
            return;
        }
        this.sourceFileQueue.push(sourceFile);
        var tabsContainer = $('#tab-container');
        tabsContainer.children().removeClass('selected');
        sourceFile.editorTab.addClass('selected');
        
        var editorContainer = $('#editor-container');
        editorContainer.children().hide();
        $('.error-reporter-widget').hide();
        sourceFile.editorPane.show();
        
        document.title = sourceFile.filePath;
    };
    
    this.closeSourceFile = function(sourceFile) {
        sourceFile.editorPane.remove();
        sourceFile.editorTab.remove();
        this.sourceFiles[sourceFile.filePath] = null;
        this.sourceFileQueue.remove(sourceFile);
        this.showSourceFile(this.sourceFileQueue.peek());
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
                var currentSourceFile = _self.sourceFileQueue.peek();
                currentSourceFile && currentSourceFile.saveFile();
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
