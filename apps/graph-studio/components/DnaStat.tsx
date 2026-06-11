interface Props {
  label: string
  items: string[]
}

export default function DnaStat({ label, items }: Props) {
  return (
    <div className="dna-stat">
      <div className="dna-stat-label">{label}</div>
      <div className="dna-stat-items">
        {items.map(item => (
          <span key={item} className="dna-tag">{item}</span>
        ))}
      </div>
    </div>
  )
}
