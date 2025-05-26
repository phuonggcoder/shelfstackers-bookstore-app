import { createContext, useState, useEffect, ReactNode } from "react";
// Created using createContext(), which provides a way to pass data through the component tree without having to pass props down manually
export const MyContext = createContext<any>(null);

class Cart {
  constructor(
    public id: string,
    public name: string,
    public image: any,
    public quantity: number,
    public price: number,
    public size: string[]
  ) {}
}

// Defines the props expected by the MyProvider component, whether nested child components or JSX elements
interface MyProviderProps {
  children: ReactNode;
}

export const MyProvider = ({ children }: MyProviderProps) => {
  // Keep track of the user's authentication status and a function to update it
  const [isAuth, setIsAuth] = useState(false);
  // Same as above but for an array that holds the user's cart products 
  const [cartProducts, setCartProducts] = useState<Cart[]>([]);

  // useEffect() to run once when the component mounts, loading data into the state from localStorage
  useEffect(() => {
    const loadAuthStatus = () => {
      try {
        const savedAuthStatus = localStorage.getItem("isAuth");
        if (savedAuthStatus !== null) {
          setIsAuth(JSON.parse(savedAuthStatus));
        }
      } catch (error) {
        console.log(error);
      }
    };

    const loadCartProducts = () => {
      try {
        const savedCartProducts = localStorage.getItem("cartProducts");
        if (savedCartProducts !== null) {
          setCartProducts(JSON.parse(savedCartProducts));
        }
      } catch (error) {
        console.log(error);
      }
    };

    loadAuthStatus();
    loadCartProducts();
  }, []); // Empty array to make sure it runs only once

  // useEffect() to run whenever the isAuth or cartProducts state changes, saving the data to localStorage
  useEffect(() => {
    const saveAuthStatus = () => {
      try {
        localStorage.setItem("isAuth", JSON.stringify(isAuth));
      } catch (error) {
        console.log(error);
      }
    };

    const saveCartProducts = () => {
      try {
        localStorage.setItem("cartProducts", JSON.stringify(cartProducts));
      } catch (error) {
        console.log(error);
      }
    };

    saveAuthStatus();
    saveCartProducts();
  }, [isAuth, cartProducts]); // Array with the dependencies to watch for changes

    // Function to increase the quantity of a cart product
    const increaseQuantity = (id: string) => {
      setCartProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === id 
            ? { ...product, quantity: product.quantity + 1 } 
            : product
        )
      );
    };
  
    // Function to decrease the quantity of a cart product (but not below 1)
    const decreaseQuantity = (id: string) => {
      setCartProducts(prevProducts =>
        prevProducts.map(product => {
          if (product.id === id && product.quantity > 1) {
            return { ...product, quantity: product.quantity - 1 };
          }
          return product;
        })
      );
    };

  // The MyContext.Provider component provides the state values to any component that consumes this context
  return (
    <MyContext.Provider
      value={{ 
        isAuth,
        setIsAuth,
        cartProducts,
        setCartProducts,
        increaseQuantity,  
        decreaseQuantity,
      }}
    >
      {children}
    </MyContext.Provider>
  );
};

export default MyProvider;
