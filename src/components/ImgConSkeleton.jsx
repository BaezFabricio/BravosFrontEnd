import { useState } from 'react'

export function ImgConSkeleton({ src, alt, className = '', containerClassName = '', ...props }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  return (
    <div className={`relative ${containerClassName}`}>
      {(!loaded || failed) && (
        <div className="absolute inset-0 bg-white/5 animate-pulse" />
      )}
      {src && !failed && (
        <img
          src={src}
          alt={alt}
          className={`${className} ${loaded ? '' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          {...props}
        />
      )}
    </div>
  )
}
