import { Outlet } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'

const ManagerDashboard = () => {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  )
}

export default ManagerDashboard