import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getAuditById } from '../../services/auditService'
import { generateReport } from '../../utils/generateReport'
import '../css/OfficerSuccess.css'

const OfficerSuccess = () => {
  const navigate = useNavigate()
  const { id } = useParams()

  const [audit, setAudit] = useState(null)

  useEffect(() => {
    getAuditById(id)
      .then(res => setAudit(res.data))
      .catch(err => console.error(err))
  }, [id])

  return (
    <div className="officer-success">
      <div className="success-card">
        <div className="success-icon">✅</div>
        <h4>Report Submitted Successfully!</h4>
        <p>
          Your inspection report has been submitted. The facility manager
          has been notified and will review the findings.
        </p>

        <div className="success-details">
          <div className="success-detail-item">
            <span>Inspection Code</span>
            <strong>{audit?.inspectionCode || `#${id}`}</strong>
          </div>
          <div className="success-detail-item">
            <span>Status</span>
            <strong style={{ color: '#4caf50' }}>Submitted</strong>
          </div>
        </div>

        <div className="success-actions">
          {/* <button
            className="btn-success outline"
            onClick={() => navigate(`/officer/inspections/${id}`)}
          >
            View Inspection
          </button> */}
          <button onClick={() => generateReport(audit)}>
            📄 View Report
          </button>
          <button
            className="btn-success primary"
            onClick={() => navigate('/officer/inspections')}
          >
            Return to Inspections
          </button>
        </div>
      </div>
    </div>
  )
}

export default OfficerSuccess