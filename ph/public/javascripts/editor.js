$(function() {
    $('#files-window ul ul').hide();
    $('#files-window .directory .title').click(function() {
        $(this).parent().find('ul:first').each(function() {
            $(this).is(':visible') ? $(this).hide() : $(this).show();
        });
    });
    
    $('.file').dblclick(function() {
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

        this.requireInit = function(ace, scala) {
            that.editor = ace.edit(editorPane[0]);
            that.editor.setTheme("ace/theme/eclipse");
            if(that.isScala) {
                var ScalaMode = scala.Mode;
                that.editor.getSession().setMode(new ScalaMode(fileName));
            }
        };
        require({
                baseUrl: baseUrl,
                paths: paths
            },
            ['ace/ace', 'ace/mode/scala'],
            that.requireInit
        );
        
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
