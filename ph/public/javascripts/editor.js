window.onload = function() {
    require({
            baseUrl: "/public/javascripts/ace",
            paths: {
                ace: "lib/ace",
                pilot: "support/pilot/lib/pilot"
            }
        },
        ['ace/ace', 'ace/mode/scala'],
        function(ace) {
            var editor = ace.edit("editor");
            editor.setTheme("ace/theme/eclipse");
            
            var ScalaMode = require("ace/mode/scala").Mode;
            editor.getSession().setMode(new ScalaMode());
    });
};
