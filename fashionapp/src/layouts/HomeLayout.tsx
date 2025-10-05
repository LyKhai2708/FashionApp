import React from 'react';
import Header from './Header';
import Footer from './Footer';
import Slider from '../components/Slider';

interface HomeLayoutProps {
  children: React.ReactNode;
}

const HomeLayout: React.FC<HomeLayoutProps> = ({ children }) => {
  return (
    <>
      <Header />
      <div className="w-full">
        <Slider />
      </div>
      <main className="w-full bg-white py-5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1320px]">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default HomeLayout;
