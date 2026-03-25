import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { Layout } from '@/components/Layout'
import { ExperimentDetailPage } from '@/pages/ExperimentDetailPage'
import { HomePage } from '@/pages/HomePage'
import { HistoryPage } from '@/pages/HistoryPage'
import { LabPage } from '@/pages/LabPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="/workspace" element={<LabPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/experiments/:id" element={<ExperimentDetailPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
