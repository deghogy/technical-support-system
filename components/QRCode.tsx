'use client'

export default function QRCode({ url }: { url: string }) {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`

  return (
    <div style={{ textAlign: 'center' }}>
      <img
        src={qrCodeUrl}
        alt="QR Code"
        style={{ width: '100px', height: '100px', borderRadius: '8px', border: '1px solid #E2E8F0' }}
      />
      <p style={{ fontSize: '11px', color: '#64748B', margin: '6px 0 0 0' }}>
        Scan to confirm
      </p>
    </div>
  )
}
