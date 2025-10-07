
import './App.css'
import { BrowserRouter, Routes } from 'react-router-dom'
import { generateRoutes } from './routes'
import { message, notification, Spin } from 'antd'
import { useState, createContext, useContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import { CartProvider } from './contexts/CartContext';

interface LoadingContextType {
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);
export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};


const MessageContext = createContext<ReturnType<typeof message.useMessage>[0] | undefined>(undefined);
export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
};

const NotificationContext = createContext<ReturnType<typeof notification.useNotification>[0] | undefined>(undefined);
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

function AppContent() {
  const { isAuthenticated } = useAuth();
  const { isLoading } = useLoading();
  
  return (
    <>
      <Spin fullscreen spinning={isLoading} size="large" />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>{generateRoutes(isAuthenticated)}</Routes>
      </BrowserRouter>
    </>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [antMessage, messageContextHolder] = message.useMessage();
  const [antNotification, notificationContextHolder] = notification.useNotification();
  
  return (
    <MessageContext.Provider value={antMessage}>
      <NotificationContext.Provider value={antNotification}>
        {messageContextHolder}
        {notificationContextHolder}
        <LoadingContext.Provider  value={{ isLoading, setIsLoading }}>
          <AuthProvider>
            <CartProvider>
              <AppContent />
            </CartProvider>
          </AuthProvider>
        </LoadingContext.Provider>
      </NotificationContext.Provider>
    </MessageContext.Provider>
  )
}

export default App
