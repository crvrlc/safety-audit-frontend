import ceatLogo from '../../assets/ceat-logo.png'
import '../css/LoginPage.css'

const Login = () => {
  const handleLogin = (role) => {
    window.location.href = `http://localhost:5001/auth/google?role=${role}`
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>

      {/* Red Header */}
      <div className="login-header">
        <img src={ceatLogo} alt="CEAT Logo" className="login-header-logo" />
        <div>
          <h4 className="login-header-title">Safety Audit Information System</h4>
          <small className="login-header-subtitle">
            College of Engineering and Agro-Industrial Technology
          </small>
        </div>
      </div>

     {/* Content Area */}
      <div className="login-content"> 
        <div className="card shadow login-card">
          <p className="login-card-subtitle">Sign in to your account to continue</p>

          <p className="login-role-label">Sign in as:</p>

          <button className="btn btn-login-outline" onClick={() => handleLogin('safety_officer')}>
            🔍 Safety Officer
          </button>
          <button className="btn btn-login-outline" onClick={() => handleLogin('facility_manager')}>
            🏢 Facility Manager
          </button>
          <button className="btn btn-login-outline" onClick={() => handleLogin('admin')}>
            ⚙️ Administrator
          </button>

          <p className="login-footer-text">All sign-ins are authenticated via Google</p>
        </div>
      </div>

    </div>
  )
}

export default Login