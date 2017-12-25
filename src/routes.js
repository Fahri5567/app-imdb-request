function routes(app) {
    app.use('/', require('../routes/index'));
    app.use('/api', require('../routes/api'));
    return app;
}

module.exports = routes;