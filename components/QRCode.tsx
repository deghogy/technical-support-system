'use client'

export default function QRCode({ url }: { url: string }) {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`

  return (
    <div style={{ textAlign: 'center' }}>
      <img
        src={qrCodeUrl}
        alt="QR Code"
        style={{ width: '200px', height: '200px', border: '2px solid var(--muted)' }}
      />
      <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '8px 0 0 0' }}>
        Scan to confirm visit
      </p>
    </div>
  )
}
