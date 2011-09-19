define(function(require, exports, module) {

var ProjectView = function(gui) {
    var _self = this;
    this.gui = gui;
    this.win = $('#project-view');
    
    this.win.find('ul ul').hide();
    this.win.find('.directory .title').click(function() {
        $(this).parent().find('ul:first').each(function() {
            $(this).is(':visible') ? $(this).hide() : $(this).show();
        });
    });
    
    this.win.find('.file').click(function() {
        var filePath = $(this).find('input').val();
        _self.gui.loadSourceFile(filePath);
    });
};

(function(){
    
    this.getWindow = function() {
        return this.win;
    }

    this.show = function() {
    }
    
}).call(ProjectView.prototype);


exports.ProjectView = ProjectView;
});
