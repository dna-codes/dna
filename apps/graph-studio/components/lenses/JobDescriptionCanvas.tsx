import type { JobDescriptionData, JobDescription } from '@/lib/lenses/job-description/fromResourceGraph'

function JobCard({ jd }: { jd: JobDescription }) {
  return (
    <article style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
            {jd.title}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            {jd.department && (
              <span className="badge badge-info">{jd.department}</span>
            )}
            {jd.reportsTo && (
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Reports to <span style={{ color: 'var(--text)' }}>{jd.reportsTo}</span>
              </span>
            )}
            {jd.filledBy && (
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                · Filled by <span style={{ color: 'var(--accent)' }}>{jd.filledBy}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      {jd.summary && (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.65, borderLeft: '2px solid var(--accent)', paddingLeft: '0.875rem' }}>
          {jd.summary}
        </p>
      )}

      {/* Responsibilities */}
      <div>
        <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.625rem' }}>
          Key Responsibilities
        </p>
        {jd.responsibilities.length === 0 ? (
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No responsibilities mapped.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {jd.responsibilities.map((r, i) => (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)' }}>{r.processName}</span>
                  {r.processDescription && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>— {r.processDescription}</span>
                  )}
                </div>
                <ul style={{ listStyle: 'none', paddingLeft: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {r.steps.map((step, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, display: 'inline-block' }} />
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

export default function JobDescriptionCanvas({ data }: { data: JobDescriptionData }) {
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '860px', margin: '0 auto' }}>
      {data.positions.map(jd => (
        <JobCard key={jd.positionId} jd={jd} />
      ))}
    </div>
  )
}
