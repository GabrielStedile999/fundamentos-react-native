import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface ProductSelected {
  id: string;
  title: string;
  image_url: string;
  price: number;
}

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: ProductSelected): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const ASYNC_STORAGE_KEY = '@GoMarketplace:products';

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storedProducts = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);

      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const newProducts = [...products];
      const productIndex = newProducts.findIndex(prod => prod.id === id);
      const productObject = newProducts.find(prod => prod.id === id);

      if (productObject) {
        newProducts.splice(productIndex, 1);
      } else {
        throw new Error('Product not found');
      }

      productObject.quantity += 1;
      newProducts.push(productObject);
      setProducts(newProducts);

      await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(products));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const newProducts = [...products];
      const productIndex = newProducts.findIndex(prod => prod.id === id);
      const productObject = newProducts.find(prod => prod.id === id);

      if (productObject) {
        newProducts.splice(productIndex, 1);
      } else {
        throw new Error('Product not found');
      }

      if (productObject.quantity <= 1) {
        setProducts(newProducts);
      } else {
        productObject.quantity -= 1;
        newProducts.push(productObject);
        setProducts(newProducts);
      }

      await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(products));
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const productIndex = products.findIndex(prod => prod.id === product.id);

      if (productIndex !== -1) {
        increment(product.id);
        return;
      }

      const newProduct = { ...product, quantity: 1 };
      products.push(newProduct);
      setProducts([...products]);

      await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(products));
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
