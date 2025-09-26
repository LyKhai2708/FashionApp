const express = require('express');
const cors = require('cors');
const JSend = require('./jsend');
const productsRouter = require('./routes/products.router');
const brandsRouter = require('./routes/brand.router');
const app = express();
const { resourceNotFound, handleError } = require('./controllers/errors.controller');
const {specs, swaggerUi} = require('./docs/swagger');
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    return res.json(JSend.success());
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
app.use('/public', express.static('public'));
productsRouter.setup(app);
brandsRouter.setup(app);

app.use(resourceNotFound);
app.use(handleError);


module.exports = app;