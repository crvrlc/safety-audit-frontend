import { Outlet } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'

const OfficerDashboard = () => {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  )
}

export default OfficerDashboard