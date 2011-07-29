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
            var editorPane = $('<pre class="editor-pane">' + content + '</pre>');
            $('#editor').append(editorPane);
            editor = new Editor(fileName, editorPane);
            editors[fileName] = editor;
        }
        
        $('#editor').children().hide();
        editor.editorPane.show();
        document.title = fileName;
    }
    
    
    var currentEditor = null;
    function Editor(fileName, editorPane) {
        currentEditor = this;
        var that = this;
        
        this.fileName = fileName;
        this.editorPane = editorPane;
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
