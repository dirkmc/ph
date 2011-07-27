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
                var paneId = fileName + '-pane';
                var editorPane = $('<pre class="editor-pane" id="' + paneId + '">' + content + '</pre>');
                $('#editor').empty().append(editorPane);
                createEditor(fileName, paneId);
                document.title = fileName;
            }
        })
    });
    
    
    
    // Ace
    var baseUrl = "/public/javascripts/ace";
    var paths = {
            ace: "lib/ace",
            pilot: "support/pilot/lib/pilot"
    };
    
    
    var currentEditor = null;
    function createEditor(fileName, editorId) {
        currentEditor = this;
        this.fileName = fileName;
        this.editorId = editorId;
        this.editor = null;

        require({
            baseUrl: baseUrl,
            paths: paths
        },
        ['ace/ace', 'ace/mode/scala'],
        function(ace, scala) {
            this.editor = ace.edit(editorId);
            editor.setTheme("ace/theme/eclipse");
            var ScalaMode = scala.Mode;
            editor.getSession().setMode(new ScalaMode(fileName));
        });
        
        
        this.saveFile = function() {
            $.ajax({
                url: '/file/save',
                type: 'POST',
                data: {
                    fileName: this.fileName,
                    content: this.editor.getSession().getDocument().getValue()
                }
            });
        }
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
