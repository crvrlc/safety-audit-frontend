import { Outlet } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'

const AdminDashboard = () => {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  )
}

export default AdminDashboard