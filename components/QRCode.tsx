'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function QRCode({ url }: { url: string }) {
  const [isHovered, setIsHovered] = useState(false)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`

  const size = isHovered ? 150 : 100

  return (
    <div style={{ textAlign: 'center' }}>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: size,
          height: size,
          position: 'relative',
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          margin: '0 auto',
        }}
      >
        <Image
          src={qrCodeUrl}
          alt="QR Code"
          fill
          sizes="150px"
          style={{ objectFit: 'contain' }}
          priority={false}
        />
      </div>
      <p style={{ fontSize: '11px', color: '#64748B', margin: '6px 0 0 0' }}>
        Scan to confirm
      </p>
    </div>
  )
}
