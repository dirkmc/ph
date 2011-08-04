$(function() {
    $('#files-window ul ul').hide();
    $('#files-window .directory .title').click(function() {
        $(this).parent().find('ul:first').each(function() {
            $(this).is(':visible') ? $(this).hide() : $(this).show();
        });
    });
    
    $('.file').click(function() {
        var fileName = $(this).find('input').val();
        loadEditor(fileName);
    });
    
    
    
    // Ace
    var baseUrl = "/public/javascripts";
    var paths = {
            ace: "ace/lib/ace",
            pilot: "ace/support/pilot/lib/pilot"
    };
    
    
    var currentEditor = null;
    var editors = {};
    
    function loadEditor(fileName) {
        var editor = editors[fileName];
        
        // Still loading the editor
        if(editor === false) {
            return;
        }
        
        if(editor != null) {
            showEditor(editor);
        } else {
            // Editor has not yet been created, so create it
            editors[fileName] = false;
            $.ajax({
                url: '/file/load',
                data: { fileName: fileName },
                success: function(content) {
                    openEditor(fileName, content);
                }
            })
        }
    }
    
    function openEditor(fileName, content) {
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
        
        var editor = new Editor(fileName, editorPane, editorTab);
        editorTab.data('editor', editor);
        editors[fileName] = editor;
        showEditor(editor);
    }
    
    function showEditor(editor) {
        currentEditor = editor;
        var tabsContainer = $('#tab-container');
        tabsContainer.children().removeClass('selected');
        editor.editorTab.addClass('selected');
        
        var editorContainer = $('#editor-container');
        editorContainer.children().hide();
        editor.editorPane.show();
        
        document.title = editor.fileName;
    }
    
    
    function Editor(fileName, editorPane, editorTab) {
        var _self = this;
        this.editorPane = editorPane;
        this.editorTab = editorTab;
        this.editor = null;
        this.serverInterface = null;
        this.fileName = fileName;
        
        require({
                baseUrl: baseUrl,
                paths: paths
            },
            ['ace/ace', 'ace/mode/scala', 'server'],
            function(ace, scala, server) {
                _self.editor = ace.edit(editorPane[0]);
                _self.editor.setTheme("ace/theme/eclipse");
                var doc = _self.editor.getSession().getDocument();
                var isScala = fileName.match(/.scala(.html)?$/) != null;            
                
                _self.serverInterface = new server.ServerInterface({
                    fileName: fileName,
                    newLine: doc.getNewLineCharacter(),
                    onCompile: function(msgs) {
                        _self.editor.getSession().setAnnotations(msgs);
                    }
                });
                
                doc.on("change", function(e) {
                    _self.serverInterface.addDelta(e.data);
                });
                
                if(isScala) {
                    var ScalaMode = scala.Mode;
                    _self.editor.getSession().setMode(new ScalaMode());
                    _self.serverInterface.compile();
                }
            }
        );
        
        this.saveFile = function() {
            _self.serverInterface.saveFile(_self.editor.getSession().getDocument().getValue());
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
