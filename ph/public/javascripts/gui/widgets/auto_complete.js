define(function(require, exports, module) {

var AutoCompleteWidget = function(editor) {
    var _self = this;
    this.editor = editor;
    this.win = $('<div id="auto-complete-widget" class="widget"></div>');
    this.optionList = $('<ul class="recent-file-list"></ul>');
    this.win.append(this.optionList);
    $(document.body).append(this.win);
};

(function(){
    
    this.getWindow = function() {
        return this.win;
    };
    
    this.checkForAutoComplete = function(delta) {
        // Check that a single character has been typed or pasted
        var range = delta.range;
        if(delta.action != "insertText" ||
                range.end.row != range.start.row ||
                (range.end.column - range.start.column != 1)) {
            return false;
        }
            
        // Make sure we're still at the same position in the document as when
        // the character was typed (the cursor may have moved)
        var deltaPos = delta.range.end;
        var currentPos = this.editor.editor.getCursorPosition();
        if(currentPos.row != deltaPos.row || currentPos.column != deltaPos.column) {
            return false;
        }
        
        // If the dot was just pressed, check for auto-complete
        var doc = this.editor.editor.getSession().getDocument();
        if(currentPos.column > 0 && doc.getLine(currentPos.row).charAt(currentPos.column - 1) == '.') {
            return true;
        }
        
        return false;
    };

    this.show = function(autoComplete) {
        var currentPos = this.editor.editor.getCursorPosition();
        if(!autoComplete ||
           autoComplete.row != currentPos.row ||
           autoComplete.column != currentPos.column
        ) {
            this.close();
            return;
        }
        
        this.showOptionList(autoComplete.options);
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
        this.win.show();
    };
    
    this.close = function() {
        this.win.hide();
    };
    
}).call(AutoCompleteWidget.prototype);


exports.AutoCompleteWidget = AutoCompleteWidget;
});
