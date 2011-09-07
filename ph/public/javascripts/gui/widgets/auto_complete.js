define(function(require, exports, module) {

var AutoCompleteWidget = function(editor) {
    this.editor = editor;
    this.listener = null;
    
    this.win = $('<div id="auto-complete-widget" class="widget" tabindex="0"></div>');
    this.optionList = $('<ul></ul>');
    this.win.append(this.optionList);
    
    // When the widget loses focus, close it
    var self = this;
    this.win.blur(function() {
        self.close();
    });
    
    this.maxBottom = $(document).height();
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
           autoComplete.column != currentPos.column ||
           autoComplete.options.length == 0
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
        this.updatePosition();
        
        this.listener = new AutoCompleteListener(this, row, column);
    };
    
    this.updatePosition = function() {
        var offset = this.win.offset();
        var bottom = offset.top + this.win.height();
        if(bottom > this.maxBottom) {
            this.win.css('height', this.maxBottom - offset.top);
        } else {
            this.win.css('height', this.win.find('ul').height());
        }
    };
    
    this.close = function() {
        this.listener && this.listener.destroy();
        this.listener = null;
        
        this.win.hide();
        this.editor.editor.focus();
    };
    
    function AutoCompleteListener(widget, startRow, startColumn) {
        var self = this;
        var doc = widget.editor.editor.getSession().getDocument();
        
        this.init = function() {
            doc.addEventListener("change", this.onDocChange); 
            widget.win.bind("keypress", this.onWidgetKeyPress);
            this.setSelectedIndex(0);
        }
        
        this.destroy = function() {
            doc.removeListener("change", this.onDocChange); 
            widget.win.unbind("keypress", this.onWidgetKeyPress);
        }
        
        this.onDocChange = function(e) {
            if(e.data.range.end.row != startRow || e.data.range.end.column <= startColumn) {
                widget.close();
            }
            
            var text = self.getFilterText();
            if(text == null) {
                widget.close();
                return;
            }
            
            text = text.toLowerCase();
            widget.optionList.find('li').each(function() {
                var option = $(this).data('option');
                if(option.name.toLowerCase().indexOf(text) == 0) {
                    $(this).show();
                } else {
                    $(this).hide();
                }
            });
            
            widget.updatePosition();
            
            self.setSelectedIndex(0);
        };
        
        this.onWidgetKeyPress = function(e) {
            switch(e.keyCode) {
                // backspace
                case 8: {
                    widget.editor.editor.removeLeft();
                    break;
                }
                // delete
                case 46: {
                    widget.editor.editor.removeRight();
                    break;
                }
                // enter
                case 13: {
                    var li = widget.optionList.find('li:visible').eq(self.getSelectedIndex());
                    self.chosen(li.data('option'));
                    break;
                }
                // escape
                case 27: {
                    widget.close();
                    break;
                }
                // left
                case 37: {
                    widget.editor.editor.navigateLeft();
                    break;
                }
                // up
                case 38: {
                    self.setSelectedIndex(self.getSelectedIndex() - 1);
                    break;
                }
                // right
                case 39: {
                    widget.editor.editor.navigateRight();
                    break;
                }
                // down
                case 40: {
                    self.setSelectedIndex(self.getSelectedIndex() + 1);
                    break;
                }
                default: {
                    if(e.charCode != 0) {
                        widget.editor.editor.insert(String.fromCharCode(e.charCode));
                    }
                }
            }
            
            // If we've moved outside the range of the auto-complete text, close
            // the widget
            var currentPos = widget.editor.editor.getCursorPosition();
            if(currentPos.row != startRow || currentPos.column < startColumn) {
                widget.close();
            }
            
            //console.log(e);
            //console.log(c + ': ' + e.keyCode + '/' + e.charCode);
            
            return false;
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
            var selectedLi = visibleElements.eq(index);
            selectedLi.addClass('selected');
            var liBottom = selectedLi.offset().top + selectedLi.height();
            if(liBottom > widget.maxBottom) {
                selectedLi.get(0).scrollIntoView(false);
            } else if(liBottom < widget.win.offset().top) {
                selectedLi.get(0).scrollIntoView(true);
            }
        };
        
        this.getSelectedIndex = function() {
            return widget.optionList.find('li.selected').prevAll(':visible').length;
        };
        
        this.getFilterText = function() {
            var text = doc.getLine(startRow).substring(startColumn);
            var matches = /([a-zA-Z0-9_]+)/.exec(text);
            if(matches == null || matches.length != 2) {
                return null;
            }
            return matches[1];
        };
        
        this.chosen = function(option) {
            if(!option) {
                return;
            }
            var text = option.name + "()";
            var filterText = this.getFilterText();
            var endColumn = startColumn + (filterText ? filterText.length : 0);
            widget.close();
            doc.removeInLine(startRow, startColumn, endColumn);
            doc.insertInLine({row: startRow, column: startColumn}, text);
            widget.editor.editor.moveCursorTo(startRow, startColumn + text.length - 1);
        };
        
        this.init();
    }
    
}).call(AutoCompleteWidget.prototype);


exports.AutoCompleteWidget = AutoCompleteWidget;
});
