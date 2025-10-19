const express = require('express');
const cors = require('cors');
const JSend = require('./jsend');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');
const promotionService = require('./services/promotions.service')
const productsRouter = require('./routes/product.router');
const brandsRouter = require('./routes/brand.router');
const sizesRouter = require('./routes/sizes.router');
const usersRouter = require('./routes/user.router');
const authRouter = require('./routes/auth.router');
const ordersRouter = require('./routes/order.router');
const favouriteRouter = require('./routes/favourite.router');
const imagesRouter = require('./routes/images.router');
const cartRouter = require('./routes/cart.router');
const categoriesRouter = require('./routes/categories.router');
const variantsRouter = require('./routes/variant.router');
const colorsRouter = require('./routes/color.router');
const promotionsRouter = require('./routes/promotions.router');
const reviewsRouter = require('./routes/review.router');
const addressRouter = require('./routes/address.router');
const adminRouter = require('./routes/admin.router');
const otpRouter = require('./routes/otp.router');
const app = express();
const { resourceNotFound, handleError } = require('./controllers/errors.controller');
const {specs, swaggerUi} = require('./docs/swagger');

const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map(s => s.trim());
app.use(cors({
    origin: corsOrigins, 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());
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
colorsRouter.setup(app);
imagesRouter.setup(app);
promotionsRouter.setup(app);
reviewsRouter.setup(app);
addressRouter.setup(app);
adminRouter.setup(app);
otpRouter.setup(app);
cron.schedule('0 0 * * *', () => {
  promotionService.autoDeactivateExpiredPromotions();
});

app.use(resourceNotFound);
app.use(handleError);


module.exports = app;