define(function(require, exports, module) {

var AutoCompleteWidget = function(editor) {
    this.editor = editor;
    this.win = $('<div id="auto-complete-widget" class="widget" tabindex="0"></div>');
    this.optionList = $('<ul class="recent-file-list"></ul>');
    this.win.append(this.optionList);
    $(document.body).append(this.win);
};

(function(){
    
    this.getWindow = function() {
        return this.win;
    };
    
    this.checkForAutoComplete = function(delta) {
        // If we're currently processing keyboard events with an open auto-complete
        // widget, don't check for more auto-complete proposals
        if(this.listener) {
            return false;
        }
        
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
        
        this.showOptionList(autoComplete);
    };
    
    this.showOptionList = function(autoComplete) {
        var options = autoComplete.options;
        var self = this;
        
        this.optionList.empty();
        for(var i = 0; i < options.length; i++) {
            var option = options[i];
            var optionString = option.name + option.symType;
            var li = $('<li>' + optionString + '</li>');
            li.data('option', option);
            li.click(function() {
                self.listener.chosen($(this).data('option'));
            });
            this.optionList.append(li);
        }
        
        var row = autoComplete.row;
        var column = autoComplete.column;
        var renderer = this.editor.editor.renderer;
        var coords = renderer.textToScreenCoordinates(row, column);
        this.win.css('left', coords.pageX);
        this.win.css('top', coords.pageY + renderer.lineHeight);
        this.win.show();
        this.win.focus();
        
        this.listener = new AutoCompleteListener(this, row, column);
    };
    
    function AutoCompleteListener(widget, startRow, startColumn) {
        var self = this;
        var doc = widget.editor.editor.getSession().getDocument();
        
        this.init = function() {
            doc.addEventListener("change", this.onDocChange); 
            widget.win.bind("keydown", this.onWidgetKeyDown);
            this.setSelectedIndex(0);
        }
        
        this.destroy = function() {
            doc.removeListener("change", this.onDocChange); 
            widget.win.unbind("keydown", this.onWidgetKeyDown);
        }
        
        this.onDocChange = function(e) {
            if(e.data.range.end.row != startRow || e.data.range.end.column < startColumn) {
                widget.close();
            }
            
            var text = self.getFilterText();
            widget.optionList.find('li').each(function() {
                var option = $(this).data('option');
                if(option.name.indexOf(text) == 0) {
                    $(this).show();
                } else {
                    $(this).hide();
                }
            });
        };
        
        this.onWidgetKeyDown = function(e) {
            switch(e.keyCode) {
                // enter
                case 13: {
                    var li = widget.optionList.find('li:visible').eq(self.getSelectedIndex());
                    self.chosen(li.data('option'));
                    return false;
                }
                // escape
                case 27: {
                    widget.close();
                    return false;
                }
                // up
                case 38: {
                    self.setSelectedIndex(self.getSelectedIndex() - 1);
                    return false;
                }
                // down
                case 40: {
                    self.setSelectedIndex(self.getSelectedIndex() + 1);
                    return false;
                }
            }
            
            return true;
        };

        
        this.setSelectedIndex = function(index) {
            if(index < 0) {
                return;
            }
            
            var visibleElements = widget.optionList.find('li:visible');
            if(index >= visibleElements.length) {
                return;
            }
            
            widget.optionList.find('li').removeClass('selected');
            visibleElements.eq(index).addClass('selected');
        };
        
        this.getSelectedIndex = function() {
            return widget.optionList.find('li:visible.selected').prevAll().length;
        };
        
        this.getFilterText = function() {
            var text = doc.getLine(startRow).substring(startColumn);
            var spacePos = text.indexOf(' ');
            if(spacePos > 0) {
                text = text.substring(0, spacePos);
            }
            return text;
        };
        
        this.chosen = function(option) {
            if(!option) {
                return;
            }
            var text = option.name + "()";
            var endColumn = startColumn + this.getFilterText().length;
            doc.removeInLine(startRow, startColumn, endColumn);
            doc.insertInLine({row: startRow, column: startColumn}, text);
            widget.editor.editor.moveCursorTo(startRow, startColumn + text.length - 1);
            widget.close();
        };
        
        this.init();
    }
    
    this.close = function() {
        this.listener && this.listener.destroy();
        this.listener = null;
        
        this.win.hide();
        this.editor.editor.focus();
    };
    
}).call(AutoCompleteWidget.prototype);


exports.AutoCompleteWidget = AutoCompleteWidget;
});
