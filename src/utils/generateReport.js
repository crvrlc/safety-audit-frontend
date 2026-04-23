import ceatLogo from '../assets/ceat-logo.png'

export const generateReport = (audit) => {
  const responses   = audit.auditResponses || []
  const sections    = audit.template?.sections || []

  // ── Metrics ──────────────────────────────────────────────────
  const yesCount       = responses.filter(r => r.answer === 'yes').length
  const noCount        = responses.filter(r => r.answer === 'no').length
  const naCount        = responses.filter(r => r.answer === 'na').length
  const applicable     = yesCount + noCount
  const complianceRate = applicable > 0
    ? Math.round((yesCount / applicable) * 100) : 0

  const findingsWithContent = responses.filter(
    r => r.answer === 'no' && (r.finding?.trim() || r.correctiveAction?.trim())
  )

  const correctiveActCount = responses.filter(
    r => r.answer === 'no' && r.correctiveAction?.trim()
  ).length

  const getComplianceLabel = (rate) => {
    if (rate >= 90) return 'High Compliance'
    if (rate >= 70) return 'Moderate Compliance'
    return 'Low Compliance'
  }

  const getComplianceColor = (rate) => {
    if (rate >= 90) return '#2e7d32'
    if (rate >= 70) return '#f57c00'
    return '#c62828'
  }

  const getSeverityColor = (severity) => {
    if (severity === 'high')   return '#c62828'
    if (severity === 'medium') return '#f57c00'
    return '#2e7d32'
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


  // duration
  const inspectionDuration = (() => {
    if (!audit.scheduledAt || !audit.submittedAt) return '—'
    const diffMs = new Date(audit.submittedAt) - new Date(audit.scheduledAt)
    if (diffMs <= 0) return '—'
    const totalSeconds = Math.floor(diffMs / 1000)
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
  })()

  // ── Section breakdown ─────────────────────────────────────────
  const sectionStats = sections.map(section => {
    const ids        = section.items.map(i => i.id)
    const sectionResponses = responses.filter(r => ids.includes(r.checklistItemId))
    const applicableRows   = sectionResponses.filter(r => r.answer !== 'na')
    if (applicableRows.length === 0) return null
    const yes  = applicableRows.filter(r => r.answer === 'yes').length
    const no   = applicableRows.filter(r => r.answer === 'no').length
    const na   = sectionResponses.filter(r => r.answer === 'na').length
    const rate = Math.round((yes / applicableRows.length) * 100)
    return { name: section.name, yes, no, na, rate }
  }).filter(Boolean)

  // ── Item lookup ───────────────────────────────────────────────
  const getItemStatement = (itemId) => {
    for (const section of sections) {
      const item = section.items?.find(i => i.id === itemId)
      if (item) return { statement: item.statement, section: section.name }
    }
    return { statement: '—', section: '—' }
  }

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-PH', {
      month: 'long', day: 'numeric', year: 'numeric'
    })
  }

  const now = new Date().toLocaleDateString('en-PH', {
    month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  const isSubmitted = audit.status === 'submitted' || audit.status === 'acknowledged' || audit.status === 'closed'
  const isAcknowledged = ['acknowledged', 'resolving', 'pending_review', 'completed'].includes(audit.status)
  // ── HTML ──────────────────────────────────────────────────────
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Inspection Report — ${audit.inspectionCode}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          font-size: 11px;
          color: #1a1a1a;
          background: #f0f0f0;
        }

        /* ── Paper container ── */
        .paper {
          width: 794px;
          min-height: 1123px;
          background: #fff;
          margin: 0 auto;
          padding: 48px 56px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.12);
        }

        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* ── Header ── */
        .report-header {
          display: flex;
          align-items: center;
          gap: 16px;
          border-bottom: 3px solid #8B0000;
          padding-bottom: 16px;
          margin-bottom: 8px;
        }
        .report-header img {
          width: 64px;
          height: 64px;
          object-fit: contain;
        }
        .report-header-text h1 {
          font-size: 15px;
          font-weight: 700;
          color: #8B0000;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .report-header-text h2 {
          font-size: 12px;
          font-weight: 600;
          color: #333;
          margin-top: 2px;
        }
        .report-header-text p {
          font-size: 10px;
          color: #666;
          margin-top: 2px;
        }
        .report-meta {
          text-align: right;
          margin-left: auto;
          font-size: 10px;
          color: #555;
          line-height: 1.6;
        }
        .report-meta strong { color: #1a1a1a; }

        /* ── Section titles ── */
        .section-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #8B0000;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 4px;
          margin: 20px 0 10px;
        }

        /* ── Details grid ── */
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px 24px;
          margin-bottom: 4px;
        }
        .detail-item label {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: #888;
          display: block;
        }
        .detail-item p {
          font-size: 11px;
          font-weight: 500;
          color: #1a1a1a;
        }
        .detail-item.full { grid-column: 1 / -1; }

        /* ── Summary cards ── */
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 4px;
        }
        .summary-card {
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          padding: 10px 12px;
          text-align: center;
        }
        .summary-card h3 {
          font-size: 20px;
          font-weight: 700;
          line-height: 1;
        }
        .summary-card p {
          font-size: 9px;
          color: #666;
          margin-top: 3px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .summary-card .level {
          font-size: 9px;
          font-weight: 600;
          margin-top: 4px;
          padding: 2px 6px;
          border-radius: 10px;
          display: inline-block;
          color: #fff;
        }

        /* ── Breakdown table ── */
        .breakdown-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
          margin-bottom: 4px;
        }
        .breakdown-table th {
          background: #8B0000 !important;
          color: #fff !important;
          padding: 6px 8px;
          text-align: left;
          font-weight: 600;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .breakdown-table td {
          padding: 6px 8px;
          border-bottom: 1px solid #f0f0f0;
          vertical-align: middle;
        }
        .breakdown-table tr:nth-child(even) td {
          background: #fafafa !important;
        }
        .compliance-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 9px;
          font-weight: 600;
          color: #fff !important;
        }
        .compliance-badge.high     { background: #2e7d32 !important; }
        .compliance-badge.moderate { background: #f57c00 !important; }
        .compliance-badge.low      { background: #c62828 !important; }
        .yes-count  { color: #2e7d32; font-weight: 600; }
        .no-count   { color: #c62828; font-weight: 600; }
        .na-count   { color: #888; }
        .rate-high     { color: #2e7d32; font-weight: 700; }
        .rate-moderate { color: #f57c00; font-weight: 700; }
        .rate-low      { color: #c62828; font-weight: 700; }

        /* ── Findings table ── */
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
        }
        th {
          background: #8B0000 !important;
          color: #fff !important;
          padding: 6px 8px;
          text-align: left;
          font-weight: 600;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        td {
          padding: 6px 8px;
          border-bottom: 1px solid #f0f0f0;
          vertical-align: top;
          line-height: 1.4;
        }
        tr:nth-child(even) td {
          background: #fafafa !important;
        }

        .severity-badge {
          display: inline-block;
          padding: 2px 7px;
          border-radius: 10px;
          font-size: 9px;
          font-weight: 600;
          color: #fff !important;
          text-transform: capitalize;
        }

        .evidence-thumb {
          width: 48px;
          height: 48px;
          object-fit: cover;
          border-radius: 4px;
          border: 1px solid #ddd;
          margin: 2px;
          cursor: pointer;
        }
        .evidence-file-link {
          display: inline-block;
          font-size: 9px;
          color: #1565c0;
          text-decoration: underline;
          margin: 2px 0;
        }

        /* ── Certification ── */
        .certification-note {
          font-size: 10px;
          color: #555;
          font-style: italic;
          margin-bottom: 16px;
          line-height: 1.6;
          border-left: 3px solid #8B0000;
          padding-left: 10px;
          background: #fdf8f8;
          padding: 10px 12px;
          border-radius: 0 4px 4px 0;
        }
        .signature-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-top: 16px;
        }
        .signature-block {
          border-top: 1px solid #333;
          padding-top: 6px;
          font-size: 10px;
        }
        .signature-block .sig-role {
          color: #888;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .signature-block .sig-name {
          font-weight: 700;
          font-size: 11px;
          color: #1a1a1a;
          margin-top: 2px;
        }
        .signature-block .sig-date {
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

        /* ── Footer ── */
        .report-footer {
          margin-top: 32px;
          border-top: 1px solid #e0e0e0;
          padding-top: 12px;
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #888;
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
        .sig-pending {
          color: #aaa;
          font-style: italic;
          font-size: 10px;
          margin-top: 4px;
        }

        /* ── Print toolbar ── */
        .print-toolbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: #8B0000;
          padding: 10px 0;
          margin-bottom: 24px;
        }
        .print-toolbar-inner {
          width: 794px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .print-toolbar-title {
          color: #fff;
          font-size: 12px;
          font-weight: 600;
        }
        .print-btn {
          background: #fff;
          color: #8B0000;
          border: none;
          padding: 7px 18px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }
        .print-btn:hover { background: #f5f5f5; }

        /* ── Print rules ── */
        @media print {
          body { background: #fff; padding: 0; }
          .paper {
            width: 100%;
            min-height: unset;
            padding: 0;
            box-shadow: none;
            margin: 0;
          }
          @page { size: A4; margin: 0.6in 0.7in; }
          .print-toolbar { display: none !important; }
        }
      </style>
    </head>
    <body>
      <!-- Print toolbar -->
      <div class="print-toolbar">
        <div class="print-toolbar-inner">
          <span class="print-toolbar-title">
            📄 Inspection Report — ${audit.inspectionCode}
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
            <h2>Official Inspection Report</h2>
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
            <label>Inspection Code</label>
            <p class="code">${audit.inspectionCode || '—'}</p>
          </div>
          <div class="detail-item">
            <label>Inspection Type</label>
            <p style="text-transform:capitalize">${audit.inspectionType?.replace('_', ' ') || '—'}</p>
          </div>
          <div class="detail-item">
            <label>Building / Facility</label>
            <p>${audit.office?.facility?.name || '—'}</p>
          </div>
          <div class="detail-item">
            <label>Unit in Charge</label>
            <p>${audit.office?.facility?.unitInCharge || '—'}</p>
          </div>
          <div class="detail-item">
            <label>Office / Room</label>
            <p>${audit.office?.name || '—'}</p>
          </div>
          <div class="detail-item">
            <label>Inspector</label>
            <p>${audit.inspector?.name || '—'}</p>
          </div>
          <div class="detail-item">
            <label>Scheduled Date</label>
            <p>${formatDate(audit.scheduledAt)}</p>
          </div>
          <div class="detail-item">
            <label>Inspection Duration</label>
            <p>${inspectionDuration}</p>
          </div>
          ${audit.purpose ? `
          <div class="detail-item full">
            <label>Purpose</label>
            <p>${audit.purpose}</p>
          </div>` : ''}
          ${audit.notes ? `
          <div class="detail-item full">
            <label>Notes</label>
            <p>${audit.notes}</p>
          </div>` : ''}
        </div>

        <!-- Compliance Summary -->
        <div class="section-title">Compliance Summary</div>
        <div class="summary-cards">
          <div class="summary-card">
            <h3 style="color:${getComplianceColor(complianceRate)}">${complianceRate}%</h3>
            <p>Compliance Rate</p>
            <span class="level" style="background:${getComplianceColor(complianceRate)}">
              ${getComplianceLabel(complianceRate)}
            </span>
          </div>
          <div class="summary-card">
            <h3 style="color:#2e7d32">${yesCount}</h3>
            <p>Compliant Items</p>
          </div>
          <div class="summary-card">
            <h3 style="color:#c62828">${noCount}</h3>
            <p>Non-Compliant Items</p>
          </div>
          <div class="summary-card">
            <h3 style="color:#1565c0">${findingsWithContent.length}</h3>
            <p>Findings Noted</p>
          </div>
        </div>

        <!-- Section Breakdown -->
        <div class="section-title">Section Compliance Breakdown</div>
        <table class="breakdown-table">
          <thead>
            <tr>
              <th>Section</th>
              <th>Yes</th>
              <th>No</th>
              <th>N/A</th>
              <th>Rate</th>
              <th>Compliance Level</th>
            </tr>
          </thead>
          <tbody>
            ${sectionStats.map(s => {
              const cls = s.rate >= 90 ? 'high' : s.rate >= 70 ? 'moderate' : 'low'
              const rateClass = s.rate >= 90 ? 'rate-high' : s.rate >= 70 ? 'rate-moderate' : 'rate-low'
              return `
                <tr>
                  <td>${s.name}</td>
                  <td class="yes-count">✓ ${s.yes}</td>
                  <td class="no-count">✗ ${s.no}</td>
                  <td class="na-count">${s.na > 0 ? s.na : '—'}</td>
                  <td class="${rateClass}">${s.rate}%</td>
                  <td><span class="compliance-badge ${cls}">${getComplianceLabel(s.rate)}</span></td>
                </tr>
              `
            }).join('')}
          </tbody>
        </table>

        <!-- Findings Table -->
        <div class="section-title">Findings & Corrective Actions</div>
        ${findingsWithContent.length === 0
          ? '<p style="color:#555; font-style:italic; padding: 8px 0;">No findings — all items are compliant.</p>'
          : `
          <table>
            <thead>
              <tr>
                <th style="width:24px">#</th>
                <th style="width:100px">Section</th>
                <th>Checklist Item</th>
                <th>Finding</th>
                <th>Corrective Action</th>
                <th style="width:56px">Severity</th>
                <th style="width:80px">Evidence</th>
              </tr>
            </thead>
            <tbody>
              ${findingsWithContent.map((r, i) => {
                const { statement, section } = getItemStatement(r.checklistItemId)
                const evidenceHtml = (r.evidence || []).map((ev, ei) => {
                  if (ev.fileType?.startsWith('image')) {
                    return `<img src="${ev.fileUrl}" alt="evidence ${ei + 1}" class="evidence-thumb" />`
                  }
                  return `<a href="${ev.fileUrl}" class="evidence-file-link" target="_blank">📄 File ${ei + 1}</a>`
                }).join('') || '—'

                return `
                  <tr>
                    <td>${i + 1}</td>
                    <td style="color:#666; font-size:9px">${section}</td>
                    <td>${statement}</td>
                    <td>${r.finding || '—'}</td>
                    <td>${r.correctiveAction || '—'}</td>
                    <td>
                      <span class="severity-badge"
                        style="background:${getSeverityColor(r.severity)}">
                        ${r.severity || 'medium'}
                      </span>
                    </td>
                    <td>${evidenceHtml}</td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>
          `
        }
        <!-- Certification -->
        <div class="section-title">Certification</div>
        <div class="certification-note">
          I hereby certify that the information contained in this inspection report is true and accurate
          to the best of my knowledge and belief, and that this inspection was conducted in accordance
          with the safety audit procedures of the College of Engineering, Architecture and Technology (CEAT).
        </div>
        <div class="signature-row">
          <div class="signature-block">
            <div class="sig-role">Safety Officer / Inspector</div>
            <div class="sig-name">${audit.inspector?.name || '—'}</div>
            ${audit.submittedAt
              ? `<div class="sig-date">Signed: ${formatDateTime(audit.submittedAt)}</div>
                <span class="sig-badge">✓ Signed</span>`
              : `<div class="sig-pending">Pending submission</div>`
            }
          </div>
          <div class="signature-block">
            <div class="sig-role">Facility Manager / Acknowledged By</div>
            ${isAcknowledged && audit.office?.facility?.facilityManagerName
              ? `<div class="sig-name">${audit.office.facility.facilityManagerName}</div>
                ${audit.acknowledgedAt ? `<div class="sig-date">Acknowledged: ${formatDateTime(audit.acknowledgedAt)}</div>` : ''}
                <span class="sig-badge">✓ Acknowledged</span>`
              : `<div class="sig-name">${audit.office?.facility?.facilityManagerName || '—'}</div>
                <div class="sig-pending">Pending acknowledgment</div>`
            }
          </div>
        </div>

        <!-- Footer -->
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
  win.onload = () => {
    win.focus()
  }
}