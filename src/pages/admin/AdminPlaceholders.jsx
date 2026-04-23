import '../css/AdminHome.css'

const BlankPage = ({ icon, title, description }) => (
  <div className="admin-home">
    <div className="blank-page">
      <div className="blank-icon">{icon}</div>
      <div className="blank-title">{title}</div>
      <div className="blank-desc">{description}</div>
    </div>
  </div>
)

export const AdminRecords = () => (
  <BlankPage
    icon="🗂️"
    title="Audit Records"
    description="All audit records will appear here. Connect to your backend to populate this page."
  />
)

export const AdminAnalytics = () => (
  <BlankPage
    icon="📊"
    title="Analytics"
    description="Charts, compliance trends, and reports will appear here."
  />
)

export const AdminMonitoring = () => (
  <BlankPage
    icon="🖥️"
    title="System Monitoring"
    description="System uptime, server health, and activity logs will appear here."
  />
)