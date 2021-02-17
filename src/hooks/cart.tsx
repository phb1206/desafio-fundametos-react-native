import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storedCart = await AsyncStorage.getItem('@GoMarketplace:cart2');

      if (storedCart) {
        const parsedCart = JSON.parse(storedCart);
        setProducts([...JSON.parse(storedCart)]);
      }
    }

    loadProducts();
    console.log(products);
  }, []);

  const increment = useCallback(
    async id => {
      setProducts(
        products.map(product =>
          product.id === id
            ? { ...product, quantity: product.quantity + 1 }
            : product,
        ),
      );

      await AsyncStorage.setItem(
        '@GoMarketplace:cart2',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const index = products.findIndex(product => product.id === id);

      if (products[index].quantity > 1) {
        setProducts(
          products.map(product =>
            product.id === id
              ? { ...product, quantity: product.quantity - 1 }
              : product,
          ),
        );
      } else {
        setProducts(state => state.filter(product => product.id === id));
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:cart2',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const updateStorage = useCallback(async () => {
    await AsyncStorage.setItem(
      '@GoMarketplace:cart2',
      JSON.stringify(products),
    );
  }, []);

  const addToCart = useCallback(
    async product => {
      const index = products.findIndex(el => el.id === product.id);
      if (index < 0) {
        const newCart = [...products, { ...product, quantity: 1 }];
        setProducts(newCart);
        await AsyncStorage.setItem(
          '@GoMarketplace:cart2',
          JSON.stringify(products),
        );
        // updateStorage();
      } else {
        increment(product.id);
      }
    },
    [increment, products],
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
