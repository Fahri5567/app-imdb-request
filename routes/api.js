const request = require('../src/request'), 
    stackTrace = require('stack-trace'),
    express = require('express'),
    router  = express.Router();

router.use((req, res, next) => {
    const reqBase = request(req.path, req.query);
    reqBase.open((error, result) => {
        if (error) {
            return next(error);
        }
        res.send(result);
    });
});

router.use((err, req, res, next) => {
    res.status(err.status || 500);
    
    const toSend = {
        'error': {}
    };
    
    toSend.error.status = err.status;
    toSend.error.code = err.code;
    toSend.error.message = err.message;
    
    Object.keys(err).map(k => {
        if (k !== Object.keys(toSend.error)) {
            toSend.error[k] = err[k];
        }
    });
    
    toSend.error.stack = stackTrace.parse(err);
    
    res.send(toSend);
});

module.exports = router;
