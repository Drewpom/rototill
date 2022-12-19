import {Product} from './model.js'

export type ServerContext = {
  productLoader(productId: string): Product | null,
};
