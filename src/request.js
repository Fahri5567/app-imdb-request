const request = require('request'),
    utils = require('./utils'),
    util = require('util'),
    path = require('path'),
    fs = require('fs');

class requestBase {
    
    constructor(requestPath, requestParam) {
        this.hostUri = 'https://app.imdb.com';
        this.requestPath = requestPath;
        this.requestParam = requestParam;
        this.param = utils.toParam(this.requestParam);
        this.requestUri = this.hostUri + requestPath + (this.param.length ? '?' + this.param : '');
        this.headers = {
            'Accept-Language': 'en, en-US;q=0.8',
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            'Accept-Charset': 'utf-8, iso-8859-1;q=0.8',
            'accept-encoding': '',
            'referer': 'http://www.google.com'
        };
        this.timeout = process.env.request_timeout || requestParam.requestTimeout || 8000;
        this.temp = {
            'dir': path.join(__dirname, '../', 'storange/temp'),
            'ttl': (60 * 60 * 24) * 2 // 2 day
        };
    }
    
    request(callback) {
        if (!this._reqCount) {
            this._reqCount = 0;
        }
        else {
            if (this._reqCount > 2) {
                delete this._reqCount;
                return callback(new Error('Max request cycle!'));
            }
        }
        request(this.requestUri, {
            'method': 'GET',
            'headers': this.headers,
            'timeout': this.timeout,
            'json': true
        }, (error, response) => {
            if (error) {
                if (error.code === 'ESOCKETTIMEDOUT' && error.connect === false) {
                    this._reqCount += 1;
                    return this.request();
                }
                return callback(error);
            }
            delete this._reqCount;
            callback(null, response);
        });
    }
    
    saveRequest(file, data, callback) {
        fs.stat(file, (error, stat) => {
            if (error) {
                if (error.code === 'ENOENT') {
                    return utils.createLocal(file, JSON.stringify(data), (error, data) => {
                        if (error) {
                            return callback(error);
                        }
                        this.saveRequest(file, data, callback);
                    });
                }
                return callback(error);
            }
            const mtime = new Date(util.inspect(stat.mtime));
            if (mtime.getTime() + (this.temp.ttl * 1000) < Date.now()) {
                return fs.unlink(file, error => {
                    if (error) {
                        return callback(error);
                    }
                    this.saveRequest(file, data, callback);
                });
            }
            utils.openLocal(file, (error, content) => {
                if (error) {
                    if (error.code && error.code === 'error_parse') {
                        return fs.unlink(file, error => {
                            if (error) {
                                return callback(error);
                            }
                            this.saveRequest(file, data, callback);
                        });
                    }
                    return callback(error);
                }
                callback(null, {
                    'requestDate': mtime,
                    'data': content
                });
            });
        });
    }
    
    open(callback) {
        const uri = utils.selectUri();
        
        if (uri !== false) {
            this.requestUri = uri + this.requestPath + (this.param.length ? '?' + this.param : '');
        }
        
        if (process.env.saveRequest && process.env.saveRequest.toLowerCase() === 'true') {
            const onlyContains = ['q', 'tconst', 'nconst'],
                param = utils.toParam(this.requestParam, onlyContains),
                fileName = this.requestPath + (param.length ? '?' + param : ''),
                file = path.resolve(this.temp.dir, utils.checksum(fileName));
            
            fs.stat(file, (error, stat) => {
                if (error) {
                    if (error.code === 'ENOENT') {
                        return this.request((error, response) => {
                            if (error) {
                                return callback(error);
                            }
                            
                            const body = response.body,
                                data = body.data;
                            
                            if (typeof data == 'object' && response.statusCode === 200 && this.temp.dir) {
                                return this.saveRequest(file, data, callback);
                            }
                            
                            return callback(null, body);
                        });
                    }
                    return callback(error);
                }
                this.saveRequest(file, null, callback);
            });
        }
        else {
            this.request((error, response) => {
                if (error) {
                    return callback(error);
                }
                callback(null, response.body);
            });
        }
    }
}

module.exports = (requestPath, requestParam) => {
    return new requestBase(requestPath, requestParam);
};
