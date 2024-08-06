const express = require('express');
const app = express();

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

admin.initializeApp({credential: admin.credential.cert(serviceAccount)})
const port = process.env.PORT || 3000;

const db = admin.firestore();
module.exports = {admin, db };

// Swagger setup
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'API Information',
      contact: {
        name: 'Vi',
      },
      servers: [{
        url: 'http://localhost:3000',
      }],
    },
  },
  apis: ['./routes/*.js'],
};

// Swagger API documentation
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


app.use(express.json());
app.use(express.urlencoded({extended: true}))

// Main router 

const userRouter = require('./router/users');
app.use('/user', userRouter);

const bookmarkRouter = require('./router/bookmark');
app.use('/bookmark', bookmarkRouter);

const cartmarkRouter = require('./router/cart');
app.use('/cart', cartmarkRouter);

const cateRouter = require('./router/category');
app.use('/category', cateRouter);

const productRouter = require('./router/product');
app.use('/product', productRouter);

const brandRouter = require('./router/brand');
app.use('/brand', brandRouter);

const voucherRouter = require('./router/voucher');
app.use('/voucher', voucherRouter);

const reviewRouter = require('./router/review');
app.use('/review', reviewRouter);

const processProductRouter = require('./router/process_product');
app.use('/process_product', processProductRouter);

const cancelProductRouter = require('./router/cancel_product');
app.use('/cancel_product', cancelProductRouter);

const deliveredProductRouter = require('./router/delivered_product');
app.use('/delivered_product', deliveredProductRouter);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});