import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface DefaultLayoutProps {
  children: React.ReactNode;
}

const DefaultLayout: React.FC<DefaultLayoutProps> = ({ children }) => {
  return (
    // <Layout className="min-w-screen bg-white">
    //   <Header />
    //     <Content>
    //     <div className="w-full bg-white">
    //       <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1660px]">
    //         {children}
    //       </div>
    //     </div>
    //     </Content>
    //   <Footer />
    // </Layout>
    <>
        <Header></Header>
            <main className="w-full bg-white py-5">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1280px]">
                    {children}
                </div>
            </main>
        <Footer></Footer>
    </>
  );
};

export default DefaultLayout;
