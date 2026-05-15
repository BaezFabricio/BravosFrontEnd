export function LogoBoxBravos({ 
  className = "", 
  width = 350, 
  height = 100,
  letterColor = "white",
  starColor = "#4a5d23"
} = {}) {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 350 100" 
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* BOX text vertical */}
      <g fill={letterColor}>
        <text x="0" y="35" fontSize="14" fontWeight="900" fontFamily="Arial Black, sans-serif">B</text>
        <text x="0" y="52" fontSize="14" fontWeight="900" fontFamily="Arial Black, sans-serif">O</text>
        <text x="0" y="69" fontSize="14" fontWeight="900" fontFamily="Arial Black, sans-serif">X</text>
      </g>

      {/* BRAVOS text */}
      <g fill={letterColor}>
        {/* B */}
        <path d="M25 15h22c8 0 14 3 14 12 0 5-3 9-7 10v0.5c5 1 9 5 9 11 0 10-7 14-16 14H25V15zm12 18h8c4 0 6-2 6-5s-2-5-6-5h-8v10zm0 20h9c5 0 7-2 7-6s-3-6-7-6h-9v12z"/>
        {/* R */}
        <path d="M70 15h22c10 0 16 5 16 14 0 7-4 12-10 13l12 20h-14l-10-18h-6v18H70V15zm12 22h8c4 0 6-2 6-6s-2-6-6-6h-8v12z"/>
        {/* A */}
        <path d="M115 15h14l18 47h-13l-3-9h-18l-3 9h-13l18-47zm7 12l-5 17h14l-5-17h-4z"/>
        {/* V */}
        <path d="M150 15h13l10 30 10-30h13l-16 47h-14l-16-47z"/>
      </g>

      {/* Star circle - military style */}
      <g transform="translate(200, 8)">
        {/* Outer circle */}
        <circle cx="42" cy="42" r="40" stroke={starColor} strokeWidth="4" fill="none" strokeDasharray="8 4"/>
        
        {/* Star */}
        <path 
          d="M42 8 L48 28 L70 28 L52 40 L58 60 L42 48 L26 60 L32 40 L14 28 L36 28 Z" 
          fill={starColor}
        />
      </g>

      {/* O with star integrated */}
      <g fill={letterColor}>
        {/* S */}
        <path d="M295 15h20v10h-14c-2 0-3 1-3 3s1 3 4 4l10 3c7 2 10 7 10 13 0 9-6 15-17 15h-22v-10h16c3 0 4-1 4-4 0-2-1-3-4-4l-10-3c-6-2-9-6-9-12 0-9 6-15 15-15z"/>
      </g>
    </svg>
  )
}
