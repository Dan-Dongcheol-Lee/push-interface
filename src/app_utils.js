(function() {

    var u = {};
    u.toJson = function(jsObject) {
        return JSON.stringify(jsObject);
    };

    u.failure = function(msg) {
        return this.toJson({status: 'failed', message: msg});
    };

    u.success = function(msg, result) {
        return this.toJson({status: 'ok', message: msg, result: result});
    };

    u.failedResult = function(msg) {
        var message = msg;
        if (typeof msg === 'string') {
            message = JSON.parse(msg);
        }
        return message.status && message.status === 'failed';
    };

    u.validateRequired = function(req, property, message) {
        if (!property) {
            req.response.statusCode(400).end(this.failure(message));
            return false;
        }
        return true;
    };

    u.toJs = function(req, buffer) {
        try {
            return JSON.parse(buffer.toString());
        } catch (ex) {
            var failed = this.failure(ex.message);
            req.response.statusCode(400).end(failed);
            return failed;
        }
    };

    // Model export
    var globalScope = (typeof global !== 'undefined' && (typeof window === 'undefined' || window === global.window)) ? global : this;
    var hasModule = (typeof module !== 'undefined' && module && module.exports);
    if (hasModule) {
        module.exports = u;
    } else if (typeof define === 'function' && define.amd) {
        define(function (require, exports, module) {
            return u;
        });
    }

}.call(this));