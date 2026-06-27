const MOOD_LABELS = {
  1: '心事如雨',
  2: '云层稍厚',
  3: '波澜不惊',
  4: '偶有微澜',
  5: '从容安然',
  6: '心生暖意',
  7: '心里发甜',
  8: '眼带笑意',
  9: '甜到心底',
  10: '满心欢喜',
}

export function getMoodLabel(value) {
  const v = Math.round(Math.max(1, Math.min(10, Number(value) || 5)))
  return MOOD_LABELS[v] || MOOD_LABELS[5]
}

export function MoodPicker({ value, onChange }) {
  return (
    <div className="mood-picker">
      <div className="mood-picker-display">
        <span className="mood-picker-score">{value}</span>
        <span className="mood-picker-divider" aria-hidden />
        <span className="mood-picker-label">{getMoodLabel(value)}</span>
      </div>
      <input
        type="range"
        className="mood-slider"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        style={{ '--mood-progress': `${((value - 1) / 9) * 100}%` }}
      />
      <div className="mood-hearts" aria-hidden>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={`mood-heart-dot${i < value ? ' active' : ''}`} />
        ))}
      </div>
    </div>
  )
}
