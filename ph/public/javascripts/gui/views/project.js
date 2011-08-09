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
        var fileName = $(this).find('input').val();
        _self.gui.loadEditor(fileName);
    });
};

(function(){
    
    this.getWindow = function() {
        return this.win;
    }

    this.show = function() {
        console.log('show project');
    }
    
}).call(ProjectView.prototype);


exports.ProjectView = ProjectView;
});
