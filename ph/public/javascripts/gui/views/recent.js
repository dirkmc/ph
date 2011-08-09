define(function(require, exports, module) {

var RecentView = function(gui) {
    this.gui = gui;
    this.win = $('<div id="recent-view">Recent</div>')
};

(function(){
    
    this.getWindow = function() {
        return this.win;
    }

    this.show = function() {
        console.log('show recent');
    }
    
}).call(RecentView.prototype);


exports.RecentView = RecentView;
});
