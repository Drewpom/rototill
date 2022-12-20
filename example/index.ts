import express from 'express';
import bodyParser from 'body-parser';
import swaggerUi from 'swagger-ui-express';
import {productsApi} from './routes.js';
import {usersApi} from './example-with-children.js';
import {Rototill, RototillValidationError} from '../src/index.js';
import {fetchProduct} from './model.js';
import { ServerContext } from './types.js';

const app = express()
const port = 3000

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello World!')
})

const serverContext: ServerContext = {
  async productLoader(productId) {
    return fetchProduct(productId);
  },
};

const mainApi = Rototill.from<ServerContext>(new Map([
  ['/products', productsApi],
  ['/users', usersApi],
]))

app.use('/api', mainApi.routes(serverContext));

app.use('/swagger', swaggerUi.serve, swaggerUi.setup(mainApi.generateOpenAPISpec('/api', {
  name: 'Example API',
  version: '1.0.0'
})));

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
