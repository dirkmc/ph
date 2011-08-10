define(function(require, exports, module) {

var AutoCompleteWidget = function(editor) {
    var _self = this;
    this.editor = editor;
    this.win = $('<div id="auto-complete-widget" class="widget"></div>');
    this.optionList = $('<ul class="recent-file-list"></ul>');
    this.win.append(this.optionList);
    $(document.body).append(this.win);
    
    this.autoCompleteTimeout = null;
};

(function(){
    
    this.getWindow = function() {
        return this.win;
    };
    
    this.checkForAutoComplete = function(delta) {
        // If a single character has been typed or pasted
        var range = delta.range;
        if(delta.action == "insertText" &&
                range.end.row == range.start.row &&
                (range.end.column - range.start.column == 1)) {
            
            // Check for auto complete
            clearTimeout(this.autoCompleteTimeout);
            var _self = this;
            this.autoCompleteTimeout = setTimeout(function() {
                _self.delayedCheckForAutoComplete(delta);
            }, 500);
        }
    };
    
    this.delayedCheckForAutoComplete = function(delta) {
        // Make sure we're still at the same position in the document
        var deltaPos = delta.range.end;
        var currentPos = this.editor.editor.getCursorPosition();
        if(currentPos.row != deltaPos.row || currentPos.column != deltaPos.column) {
            return;
        }
        
        // If the dot was just pressed, check for auto-complete
        var doc = this.editor.editor.getSession().getDocument();
        if(currentPos.column > 0 && doc.getLine(currentPos.row).charAt(currentPos.column - 1) == '.') {
            this.show();
        }
    };

    this.show = function() {
        this.optionList.empty();
        this.win.show();
        var currentPos = this.editor.editor.getCursorPosition();
        
        var _self = this;
        $.ajax({
            url: '/file/auto-complete.json',
            type: 'GET',
            dataType: 'json',
            data: {
                row: currentPos.row,
                column: currentPos.column,
                fileName: _self.editor.fileName
            },
            success: function(options) {
                _self.showOptionList(options);
            }
        });
    };
    
    this.showOptionList = function(options) {
        var _self = this;
        this.optionList.empty();
        for(var i = 0; i < options.length; i++) {
            var li = $('<li>' + options[i] + '</li>');
            li.data('option', options[i]);
            li.click(function() {
                _self.close();
            });
            this.optionList.append(li);
        }
    };
    
    this.close = function() {
        this.win.hide();
    };
    
}).call(AutoCompleteWidget.prototype);


exports.AutoCompleteWidget = AutoCompleteWidget;
});
