import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Test from '../components/test'

const Root = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div> Thit is Router 6 </div>} />
        <Route path="/test" element={<Test />} />
        <Route path="*" element={<h3>404</h3>} />
      </Routes>
      </BrowserRouter>
  )
}

export default Root
