$(function() {
    
    var baseUrl = "/public/javascripts";
    var paths = {
            ace: "ace/lib/ace",
            pilot: "ace/support/pilot/lib/pilot"
    };
    
    require({
            baseUrl: baseUrl,
            paths: paths
        },
        ['gui/gui'],
        function(gui) {
            new gui.Gui();
        }
    );
});
