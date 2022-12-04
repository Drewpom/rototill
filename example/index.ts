import express from 'express';
import {productsApi} from './routes.js';

const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

// app.use('/fdsfs', )

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
  console.log(productsApi);
})
