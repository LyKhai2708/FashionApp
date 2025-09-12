import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Headers from './layouts/Header'
import Footer from './layouts/Footer'
import './App.css'
import Slider from './components/Slider'
import ProductCard from './components/ProductCard'
import ProductList from './components/ProductList'

function App() {
  return (
    <>
    <Headers></Headers>
    <Slider></Slider>
    <div className="w-full bg-white py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1660px]">
        <ProductList/>
      </div>
    </div>
    
    <Footer></Footer>

    
    </>
  )
}

export default App
