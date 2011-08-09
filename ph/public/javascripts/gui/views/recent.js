define(function(require, exports, module) {

var RecentView = function(gui) {
    var _self = this;
    this.gui = gui;
    this.win = $('<div id="recent-view" class="view"></div>');
    this.searchField = $('<input type="text"/>');
    this.fileList = $('<ul class="recent-file-list"></ul>');
    this.win.append(this.searchField);
    this.win.append(this.fileList);
    
    this.sendTimeout = null;
    this.searchField.keydown(function() {
        clearTimeout(this.sendTimeout);
        this.sendTimeout = setTimeout(function() {
            _self.getRecentFiles(_self.searchField.val());
        }, 500);
    });
};

(function(){
    
    this.getWindow = function() {
        return this.win;
    };

    this.show = function() {
        this.searchField.val('');
        this.fileList.empty();
        this.searchField.focus();
    };
    
    this.getRecentFiles = function(val) {
        val = $.trim(val);
        if(val.length == 0) {
            this.showFileList([]);
            return;
        }
        var filter = '^' + val.replace('.', '\\.').replace('*', '.*') + '.*$';
        
        var _self = this;
        $.ajax({
            url: '/project/recent.json',
            type: 'GET',
            dataType: 'json',
            data: {
                filter: filter
            },
            success: function(files) {
                _self.showFileList(files);
            }
        });
    };
    
    this.showFileList = function(files) {
        var _self = this;
        this.fileList.empty();
        var projectRoot = this.gui.getProjectRoot();
        for(var i = 0; i < files.length; i++) {
            var relativePath = files[i].substring(projectRoot.length);
            var li = $('<li>' + relativePath + '</li>');
            li.data('file', files[i]);
            li.click(function() {
                _self.gui.loadEditor($(this).data('file'));
                _self.close();
            });
            this.fileList.append(li);
        }
    };
    
    this.close = function() {
        this.gui.leftPane.show('project');
    };
    
}).call(RecentView.prototype);


exports.RecentView = RecentView;
});
