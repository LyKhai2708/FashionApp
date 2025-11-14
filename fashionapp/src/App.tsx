
import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { generateRoutes } from './routes'
import { notification, Spin } from 'antd'
import { useState, createContext, useContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';
import { useToast } from './contexts/ToastContext';
import { AdminAuthProvider } from './contexts/admin/AdminAuthContext';
import AdminRoutes from './routes/admin/AdminRoutes';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ChatWidget from './components/ChatWidget';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;


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




export const useMessage = useToast;

const NotificationContext = createContext<ReturnType<typeof notification.useNotification>[0] | undefined>(undefined);
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

function UserAppContent() {
  const { isAuthenticated } = useAuth();
  const { isLoading } = useLoading();
  
  return (
    <>
      <Spin fullscreen spinning={isLoading} size="large" />
        <ScrollToTop />
        <Routes>{generateRoutes(isAuthenticated)}</Routes>
        <ChatWidget />
    </>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [antNotification, notificationContextHolder] = notification.useNotification();
  
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ToastProvider>
        <NotificationContext.Provider value={antNotification}>
          {notificationContextHolder}
          <LoadingContext.Provider  value={{ isLoading, setIsLoading }}>
            <BrowserRouter>
              <Routes>
                <Route path="/*" element={
                  <AuthProvider>
                    <CartProvider>
                      <FavoritesProvider>
                        <UserAppContent />
                      </FavoritesProvider>
                    </CartProvider>
                  </AuthProvider>
                } />
                <Route
                  path="/admin/*"
                  element={
                    <AdminAuthProvider>
                      <AdminRoutes />
                    </AdminAuthProvider>
                  }
                />
              </Routes>

            </BrowserRouter>
            
          </LoadingContext.Provider>
        </NotificationContext.Provider>
      </ToastProvider>
    </GoogleOAuthProvider>
  )
}

export default App
