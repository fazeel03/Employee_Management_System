import { Search, X } from 'lucide-react'

const SearchBar = ({ 
  value, 
  onChange, 
  placeholder = 'Search...',
  onClear 
}) => {
  return (
    <div style={{
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      width: '320px'
    }}>
      <Search 
        size={16} 
        style={{
          position: 'absolute',
          left: '12px',
          color: '#9CA3AF',
          pointerEvents: 'none'
        }}
      />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 36px 10px 36px',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          fontSize: '14px',
          outline: 'none',
          backgroundColor: '#F9FAFB',
          color: '#111827',
          transition: 'all 0.2s',
        }}
        onFocus={e => {
          e.target.style.borderColor = '#6366F1'
          e.target.style.backgroundColor = '#fff'
          e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'
        }}
        onBlur={e => {
          e.target.style.borderColor = '#E5E7EB'
          e.target.style.backgroundColor = '#F9FAFB'
          e.target.style.boxShadow = 'none'
        }}
      />
      {value && (
        <X
          size={16}
          onClick={() => onChange('')}
          style={{
            position: 'absolute',
            right: '12px',
            color: '#9CA3AF',
            cursor: 'pointer',
          }}
        />
      )}
    </div>
  )
}

export default SearchBar
