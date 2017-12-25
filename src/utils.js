const crypto = require('crypto'),
    fs = require('fs');

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function checksum(str, algorithm, encoding) {
    return crypto
        .createHash(algorithm || 'md5')
        .update(str, 'utf8')
        .digest(encoding || 'hex');
}

function selectUri() {
    const request_server_api = process.env.request_server_api,
        servers =  request_server_api ? request_server_api.split(',') : false;
        
    if (servers.length) {
        const selectedServer = servers[getRandomInt(0, servers.length)];
        return selectedServer + 'api';
    }
    
    return false;
}

function createLocal(file, content, callback) {
    fs.writeFile(file, content, 'utf8', function(error) {
        if (error) {
            return callback(error);
        }
        callback(null, JSON.stringify(content));
    });
}

function openLocal(file, callback) {
    fs.readFile(file, 'utf8', (error, result) => {
        if (error) {
          return callback(error); 
        }
        try {
            const content = JSON.parse(result);
            callback(null, content);
        } catch (e) {
            e.code = 'error_parse';
            callback(e);
        }
    });
}

function toParam(values, keyContains) {
    const param = [];
    Object.keys(values).forEach(function(key) {
        if (typeof keyContains !== 'undefined' && Array.isArray(keyContains)) {
            if (keyContains.includes(key)) {
                param.push(key + '=' + encodeURIComponent(values[key]));
            }
        }
        else {
            param.push(key + '=' + encodeURIComponent(values[key]));
        }
    });
    return param.join('&');
}

module.exports.getRandomInt = getRandomInt;
module.exports.checksum = checksum;
module.exports.selectUri = selectUri;
module.exports.createLocal = createLocal;
module.exports.openLocal = openLocal;
module.exports.toParam = toParam;
