import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [careerProfile, setCareerProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchAllProfiles(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchAllProfiles(session.user.id)
      } else {
        setProfile(null)
        setCareerProfile(null)
        setLoading(false)
        if (event === 'SIGNED_OUT') navigate('/', { replace: true })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchAllProfiles(userId) {
    const [profileRes, careerRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('user_profiles').select('*').eq('user_id', userId).single(),
    ])
    setProfile(profileRes.data)
    setCareerProfile(careerRes.data)
    setLoading(false)
  }

  async function refreshProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
  }

  async function refreshCareerProfile() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single()
    setCareerProfile(data)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, careerProfile, loading, signOut, refreshProfile, refreshCareerProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
