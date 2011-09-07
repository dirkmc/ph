define(function(require, exports, module) {

var ErrorReporterWidget = function(editor) {
    this.editor = editor;
    this.rowErrorMap = {};
    
    this.win = $('<div id="error-reporter-widget" class="widget"></div>');
    this.errorList = $('<ul></ul>');
    this.win.append(this.errorList);
    
    this.docBottom = $(document).height();
    $(document.body).append(this.win);
    
    // Start timer to check for the cursor position.
    // This is not a great solution, it would be better if the editor fired
    // events when the cursor moved.
    this.previousRow = -1;
    this.errorMapChanged = true;
    var self = this;
    setInterval(function() { self.checkCursorPosition() }, 500);
};

(function(){
    
    this.getWindow = function() {
        return this.win;
    };
    
    this.setErrors = function(errors) {
        this.errorMapChanged = true;
        this.rowErrorMap = {};
        for(var i = 0; i < errors.length; i++) {
            var error = errors[i];
            if(this.rowErrorMap[error.row] == null) {
                this.rowErrorMap[error.row] = [error];
            } else {
                this.rowErrorMap[error.row].push(error);
            }
        }
    }
    
    this.checkCursorPosition = function() {
        var row = this.editor.editor.getCursorPosition().row;
        var previousRow = this.previousRow;
        this.previousRow = row;
        if(row == previousRow && !this.errorMapChanged) {
            return;
        }
        this.errorMapChanged = false;
        
        if(!this.rowErrorMap[row]) {
            this.close();
            return;
        }
        
        this.showErrors(this.rowErrorMap[row]);
    };

    this.showErrors = function(errors) {
        this.errorList.empty();
        for(var i = 0; i < errors.length; i++) {
            var error = errors[i];
            var li = $('<li>' + error.text + '</li>');
            this.errorList.append(li);
        }
        
        this.win.show();
    };
    
    this.close = function() {
        this.win.hide();
    };
    
}).call(ErrorReporterWidget.prototype);


exports.ErrorReporterWidget = ErrorReporterWidget;
});
