import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Home from './pages/Home'
import Login from './pages/Login'
import Setup from './pages/Setup'
import NewsFeed from './pages/NewsFeed'
import Roadmap from './pages/Roadmap'
import Resume from './pages/Resume'
import InterviewPrep from './pages/InterviewPrep'
import Opportunities from './pages/Opportunities'

export default function App() {
  return (
    <>
      <div className="axiom-grid" />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Home />} />
        <Route path="/signup" element={<Login />} />
        <Route path="/setup" element={<ProtectedRoute><Setup /></ProtectedRoute>} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/news" element={<NewsFeed />} />
                  <Route path="/roadmap" element={<Roadmap />} />
                  <Route path="/resume" element={<Resume />} />
                  <Route path="/interview" element={<InterviewPrep />} />
                  <Route path="/opportunities" element={<Opportunities />} />
                  <Route path="*" element={<Navigate to="/news" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}
