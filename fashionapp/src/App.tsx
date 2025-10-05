
import './App.css'
import { BrowserRouter, Routes } from 'react-router-dom'
import { generateRoutes } from './routes'
import { message, Spin } from 'antd'
import { useState, createContext, useContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';

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

function AppContent() {
  const { isAuthenticated } = useAuth();
  const { isLoading } = useLoading();
  
  return (
    <>
      <Spin fullscreen spinning={isLoading} size="large" />
      <BrowserRouter>
        <Routes>{generateRoutes(isAuthenticated)}</Routes>
      </BrowserRouter>
    </>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [antMessage, contextHolder] = message.useMessage();
  
  return (
    <MessageContext.Provider value={antMessage}>
      {contextHolder}
      <LoadingContext.Provider  value={{ isLoading, setIsLoading }}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LoadingContext.Provider>
    </MessageContext.Provider>
  )
}

export default App
