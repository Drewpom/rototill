
export type Product = {
  id: string;
  name: string;
}

const data: Product[] = [
  {
    id: '12345',
    name: 'Test',
  }
]

export const fetchProduct = (productId: string): Product | null => {
  return data.find(p => p.id === productId) ?? null;
}
