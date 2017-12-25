const express = require('express'),
    router  = express.Router();

router.get('/', function(req, res) {
    res.send('Nothing here :D');
});

module.exports = router;