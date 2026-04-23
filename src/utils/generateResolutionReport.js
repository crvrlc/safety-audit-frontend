// src/utils/generateResolutionReport.js
import ceatLogo from '../assets/ceat-logo.png'

export const generateResolutionReport = (audit) => {
  const responses = audit.auditResponses || []
  const sections  = audit.template?.sections || []

  const resolvedFindings = responses.filter(
    r => r.answer === 'no' && r.resolutionStatus === 'resolved'
  )

  // ── Compliance rate saved at submission time ──
  const complianceRate = audit.auditReport?.complianceRate ?? null

  const getComplianceColor = (rate) => {
    if (rate === null) return '#888'
    if (rate >= 85) return '#2e7d32'
    if (rate >= 70) return '#f57c00'
    return '#c62828'
  }

  const getComplianceLabel = (rate) => {
    if (rate === null) return '—'
    if (rate >= 85) return 'High'
    if (rate >= 70) return 'Moderate'
    return 'Low'
  }

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-PH', {
      month: 'long', day: 'numeric', year: 'numeric'
    })
  }

  const formatDateTime = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getItemStatement = (itemId) => {
    for (const section of sections) {
      const item = section.items?.find(i => i.id === itemId)
      if (item) return { statement: item.statement, section: section.name }
    }
    return { statement: '—', section: '—' }
  }

  const getSeverityColor = (s) => {
    if (s === 'high')   return '#c62828'
    if (s === 'medium') return '#f57c00'
    return '#2e7d32'
  }

  const now = new Date().toLocaleDateString('en-PH', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  const managerCertified = ['pending_review', 'completed'].includes(audit.status)
  const officerSignedOff = audit.status === 'completed'

  const managerName = audit.office?.facility?.facilityManagerName || '—'
  const officerName = audit.inspector?.name || '—'

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Resolution Report — ${audit.inspectionCode}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important; }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          font-size: 11px;
          color: #1a1a1a;
          background: #f0f0f0;
        }
        .paper {
          width: 794px;
          min-height: 1123px;
          background: #fff;
          margin: 0 auto;
          padding: 48px 56px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.12);
        }
        .print-toolbar {
          position: sticky; top: 0; z-index: 100;
          background: #1b5e20; padding: 10px 0; margin-bottom: 24px;
        }
        .print-toolbar-inner {
          width: 794px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
        }
        .print-toolbar-title { color: #fff; font-size: 12px; font-weight: 600; }
        .print-btn {
          background: #fff; color: #1b5e20; border: none;
          padding: 7px 18px; border-radius: 6px;
          font-size: 11px; font-weight: 700; cursor: pointer;
        }
        .report-header {
          display: flex; align-items: center; gap: 16px;
          border-bottom: 3px solid #1b5e20;
          padding-bottom: 16px; margin-bottom: 8px;
        }
        .report-header img { width: 64px; height: 64px; object-fit: contain; }
        .report-header-text h1 {
          font-size: 15px; font-weight: 700; color: #1b5e20;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .report-header-text h2 { font-size: 12px; font-weight: 600; color: #333; margin-top: 2px; }
        .report-header-text p  { font-size: 10px; color: #666; margin-top: 2px; }
        .report-meta { text-align: right; margin-left: auto; font-size: 10px; color: #555; line-height: 1.6; }
        .section-title {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.5px; color: #1b5e20;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 4px; margin: 20px 0 10px;
        }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; }
        .detail-item label { font-size: 9px; text-transform: uppercase; color: #888; display: block; }
        .detail-item p { font-size: 11px; font-weight: 500; }
        .detail-item.full { grid-column: 1 / -1; }

        /* ── Compliance rate pill inside details ── */
        .compliance-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 2px;
        }
        .compliance-pill-rate {
          font-size: 15px;
          font-weight: 700;
          line-height: 1;
        }
        .compliance-pill-label {
          font-size: 9px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 10px;
          color: #fff;
        }

        .finding-card {
          border: 1px solid #e0e0e0; border-radius: 6px;
          padding: 12px 16px; margin-bottom: 12px;
        }
        .finding-card-header {
          display: flex; justify-content: space-between;
          align-items: flex-start; margin-bottom: 8px;
        }
        .finding-number {
          font-size: 10px; font-weight: 700; color: #888;
          text-transform: uppercase; letter-spacing: 0.3px;
        }
        .severity-badge {
          display: inline-block; padding: 2px 8px;
          border-radius: 10px; font-size: 9px;
          font-weight: 600; color: #fff;
        }
        .finding-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin-bottom: 8px; }
        .finding-field label { font-size: 9px; text-transform: uppercase; color: #888; display: block; }
        .finding-field p { font-size: 10px; line-height: 1.4; }
        .finding-field.full { grid-column: 1 / -1; }
        .resolution-box {
          background: #f1f8e9; border-left: 3px solid #2e7d32;
          padding: 8px 12px; border-radius: 0 4px 4px 0; margin-top: 8px;
        }
        .resolution-box label { font-size: 9px; text-transform: uppercase; color: #2e7d32; display: block; font-weight: 600; }
        .resolution-box p { font-size: 10px; margin-top: 2px; }
        .evidence-img { width: 120px; height: 80px; object-fit: cover; border-radius: 4px; margin-top: 6px; cursor: pointer; }

        /* ── Summary boxes ── */
        .summary-row { display: flex; gap: 12px; margin-bottom: 4px; }
        .summary-box {
          flex: 1; border: 1px solid #e0e0e0; border-radius: 6px;
          padding: 10px; text-align: center;
        }
        .summary-box h3 { font-size: 20px; font-weight: 700; }
        .summary-box p  { font-size: 9px; color: #666; margin-top: 2px; text-transform: uppercase; }

        /* ── Compliance rate highlight box ── */
        .compliance-highlight-box {
          border-radius: 6px;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          border: 1px solid #e0e0e0;
        }
        .compliance-highlight-left label {
          font-size: 9px;
          text-transform: uppercase;
          color: #888;
          display: block;
          margin-bottom: 2px;
        }
        .compliance-highlight-left span {
          font-size: 11px;
          color: #444;
        }
        .compliance-highlight-rate {
          font-size: 28px;
          font-weight: 800;
          line-height: 1;
        }
        .compliance-highlight-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 10px;
          color: #fff;
          margin-top: 4px;
          display: inline-block;
        }

        /* ── Certification ── */
        .certification-note {
          font-size: 10px;
          color: #555;
          font-style: italic;
          line-height: 1.6;
          border-left: 3px solid #1b5e20;
          background: #f1f8e9;
          padding: 10px 12px;
          border-radius: 0 4px 4px 0;
          margin-bottom: 20px;
        }
        .signature-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-top: 8px;
        }
        .signature-block {
          border-top: 1px solid #333;
          padding-top: 6px;
          font-size: 10px;
        }
        .sig-role {
          color: #888;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .sig-name {
          font-weight: 700;
          font-size: 11px;
          color: #1a1a1a;
          margin-top: 2px;
        }
        .sig-date {
          font-size: 9px;
          color: #888;
          margin-top: 2px;
        }
        .sig-pending {
          color: #aaa;
          font-style: italic;
          font-size: 10px;
          margin-top: 4px;
        }
        .sig-badge {
          display: inline-block;
          margin-top: 4px;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 9px;
          font-weight: 600;
          color: #fff;
          background: #2e7d32;
        }
        .report-footer {
          margin-top: 32px; border-top: 1px solid #e0e0e0; padding-top: 12px;
          display: flex; justify-content: space-between; font-size: 9px; color: #888;
        }
        @media print {
          body { background: #fff; padding: 0; }
          .paper { width: 100%; min-height: unset; padding: 0; box-shadow: none; margin: 0; }
          .print-toolbar { display: none !important; }
          @page { size: A4; margin: 0.6in 0.7in; }
        }
      </style>
    </head>
    <body>

      <div class="print-toolbar">
        <div class="print-toolbar-inner">
          <span class="print-toolbar-title">
            ✅ Resolution Report — ${audit.inspectionCode}
          </span>
          <button class="print-btn" onclick="window.print()">
            🖨️ Print / Save as PDF
          </button>
        </div>
      </div>

      <div class="paper">

        <!-- Header -->
        <div class="report-header">
          <img src="${ceatLogo}" alt="CEAT Logo" />
          <div class="report-header-text">
            <h1>Safety Audit Assessment System</h1>
            <h2>Corrective Actions Resolution Report</h2>
            <p>College of Engineering, Architecture and Technology</p>
          </div>
          <div class="report-meta">
            <strong>${audit.inspectionCode}</strong><br/>
            Generated: ${now}<br/>
            Status: <strong>${audit.status?.replace(/_/g, ' ').toUpperCase()}</strong>
          </div>
        </div>

        <!-- Inspection Details -->
        <div class="section-title">Inspection Details</div>
        <div class="details-grid">
          <div class="detail-item">
            <label>Inspection Type</label>
            <p style="text-transform:capitalize">
              ${audit.inspectionType?.replace('_', ' ') || '—'}
            </p>
          </div>
          <div class="detail-item">
            <label>Inspector</label>
            <p>${audit.inspector?.name || '—'}</p>
          </div>
          <div class="detail-item">
            <label>Building / Facility</label>
            <p>${audit.office?.facility?.name || '—'}</p>
          </div>
          <div class="detail-item">
            <label>Office / Room</label>
            <p>${audit.office?.name || '—'}</p>
          </div>
          <div class="detail-item">
            <label>Submitted Date</label>
            <p>${formatDateTime(audit.submittedAt)}</p>
          </div>
          <div class="detail-item">
            <label>Acknowledged Date</label>
            <p>${formatDateTime(audit.acknowledgedAt)}</p>
          </div>

          <!-- Compliance rate at submission -->
          <div class="detail-item full" style="margin-top:4px">
            <label>Compliance Rate at Submission</label>
            ${complianceRate !== null ? `
              <div class="compliance-pill">
                <span class="compliance-pill-rate" style="color:${getComplianceColor(complianceRate)}">
                  ${complianceRate}%
                </span>
                <span class="compliance-pill-label" style="background:${getComplianceColor(complianceRate)}">
                  ${getComplianceLabel(complianceRate)}
                </span>
              </div>
            ` : `<p>—</p>`}
          </div>
        </div>

        <!-- Resolution Summary -->
        <div class="section-title">Resolution Summary</div>

        <!-- Compliance rate highlight -->
        ${complianceRate !== null ? `
          <div class="compliance-highlight-box"
            style="background:${complianceRate >= 85 ? '#f1f8e9' : complianceRate >= 70 ? '#fffbeb' : '#fef2f2'}">
            <div class="compliance-highlight-left">
              <label>Compliance Rate at Submission</label>
              <span>Recorded when the officer submitted the inspection report</span>
            </div>
            <div style="text-align:right">
              <div class="compliance-highlight-rate" style="color:${getComplianceColor(complianceRate)}">
                ${complianceRate}%
              </div>
              <span class="compliance-highlight-badge"
                style="background:${getComplianceColor(complianceRate)}">
                ${getComplianceLabel(complianceRate)} Compliance
              </span>
            </div>
          </div>
        ` : ''}

        <div class="summary-row">
          <div class="summary-box">
            <h3 style="color:#2e7d32">${resolvedFindings.length}</h3>
            <p>Findings Resolved</p>
          </div>
          <div class="summary-box">
            <h3 style="color:#c62828">
              ${resolvedFindings.filter(f => f.severity === 'high').length}
            </h3>
            <p>High Severity Resolved</p>
          </div>
          <div class="summary-box">
            <h3 style="color:#555">
              ${resolvedFindings.filter(f => f.resolutionEvidence).length}
            </h3>
            <p>With Photo Evidence</p>
          </div>
        </div>

        <!-- Resolved Findings -->
        <div class="section-title">Resolved Corrective Actions</div>
        ${resolvedFindings.map((r, i) => {
          const { statement, section } = getItemStatement(r.checklistItemId)
          return `
            <div class="finding-card">
              <div class="finding-card-header">
                <span class="finding-number">Finding #${i + 1} — ${section}</span>
                <span class="severity-badge"
                  style="background:${getSeverityColor(r.severity)}">
                  ${(r.severity || 'medium').toUpperCase()}
                </span>
              </div>
              <div class="finding-grid">
                <div class="finding-field full">
                  <label>Checklist Item</label>
                  <p>${statement}</p>
                </div>
                <div class="finding-field full">
                  <label>Finding</label>
                  <p>${r.finding || '—'}</p>
                </div>
                <div class="finding-field full">
                  <label>Corrective Action Required</label>
                  <p>${r.correctiveAction || '—'}</p>
                </div>
                <div class="finding-field">
                  <label>Assigned To</label>
                  <p>${r.assignedTo || '—'}</p>
                </div>
                <div class="finding-field">
                  <label>Resolved At</label>
                  <p>${formatDateTime(r.resolvedAt)}</p>
                </div>
              </div>
              <div class="resolution-box">
                <label>✅ Actions Taken</label>
                <p>${r.resolutionNote || '—'}</p>
                ${r.resolutionEvidence ? `
                  <img
                    src="${r.resolutionEvidence}"
                    alt="Resolution evidence"
                    class="evidence-img"
                  />
                ` : ''}
              </div>
            </div>
          `
        }).join('')}

        <!-- Certification -->
        <div class="section-title">Certification</div>
        <div class="certification-note">
          The undersigned hereby certify that all corrective actions identified in inspection report
          <strong>${audit.inspectionCode}</strong> have been implemented and completed.
          The Facility Manager certifies completion of all corrective actions, and the Safety Officer
          confirms verification of the resolutions listed in this report.
        </div>

        <div class="signature-row">
          <div class="signature-block">
            <div class="sig-role">Facility Manager</div>
            ${managerCertified
              ? `<div class="sig-name">${managerName}</div>
                 <div class="sig-date">Certified: ${formatDateTime(audit.completedAt || audit.acknowledgedAt)}</div>
                 <span class="sig-badge">✓ Certified</span>`
              : `<div class="sig-name">${managerName}</div>
                 <div class="sig-pending">Pending certification</div>`
            }
          </div>
          <div class="signature-block">
            <div class="sig-role">Safety Officer</div>
            ${officerSignedOff
              ? `<div class="sig-name">${officerName}</div>
                 <div class="sig-date">Verified: ${formatDateTime(audit.completedAt)}</div>
                 <span class="sig-badge">✓ Verified</span>`
              : `<div class="sig-name">${officerName}</div>
                 <div class="sig-pending">Pending officer sign-off</div>`
            }
          </div>
        </div>

        <div class="report-footer">
          <span>Safety Audit Assessment System — CEAT</span>
          <span>${audit.inspectionCode} &nbsp;|&nbsp; Generated ${now}</span>
        </div>

      </div>
    </body>
    </html>
  `

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  win.focus()
}

export default generateResolutionReport