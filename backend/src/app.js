const express = require('express');
const cors = require('cors');
const JSend = require('./jsend');

const productsRouter = require('./routes/product.router');
const brandsRouter = require('./routes/brand.router');
const sizesRouter = require('./routes/sizes.router');
const usersRouter = require('./routes/user.router');
const authRouter = require('./routes/auth.router');
const ordersRouter = require('./routes/order.router');
const favouriteRouter = require('./routes/favourite.router');
const cartRouter = require('./routes/cart.router');
const categoriesRouter = require('./routes/categories.router');
const variantsRouter = require('./routes/variant.router');
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


//routes
productsRouter.setup(app);
brandsRouter.setup(app);
sizesRouter.setup(app);
usersRouter.setup(app);
authRouter.setup(app);
ordersRouter.setup(app);
cartRouter.setup(app);
categoriesRouter.setup(app);
favouriteRouter.setup(app);
variantsRouter.setup(app);


app.use(resourceNotFound);
app.use(handleError);


module.exports = app;