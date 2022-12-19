import express from 'express';
import bodyParser from 'body-parser';
import {productsApi} from './routes.js';
import {RototillValidationError} from '../src/index.js';
import {fetchProduct} from './model.js';

const app = express()
const port = 3000

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello World!')
})

// app.use('/fdsfs', )
app.use('/products', productsApi.routes({
  productLoader(productId) {
    return fetchProduct(productId);
  },
}));

app.use(function errorHandler (err: Error, _req: express.Request, res: express.Response, next: any) {
  if (res.headersSent) {
    return next(err)
  }

  if (err instanceof RototillValidationError) {
    return res.status(400).send({
      message: err.message,
      errors: err.errorObjects,
    });
  }

  res.status(500).send({
    message: err.message,
  })
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
