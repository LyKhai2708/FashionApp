import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Headers from './layouts/Header'
import Footer from './layouts/Footer'
import './App.css'
import Slider from './components/Slider'

function App() {
  return (
    <>
    <div className="flex flex-col min-h-screen">
      <Headers />
      <Slider />
      <main className="flex-1 px-4 py-6">
        
      </main>
      <Footer/>
    </div>

    
    </>
  )
}

export default App
