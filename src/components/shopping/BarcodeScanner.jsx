import { useRef, useState } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import { BrowserMultiFormatReader } from '@zxing/library'

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)

async function scanImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)

      if ('BarcodeDetector' in window) {
        const detector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code']
        })
        detector.detect(canvas).then(barcodes => {
          if (barcodes.length > 0) resolve(barcodes[0].rawValue)
          else reject(new Error('No barcode found'))
        }).catch(reject)
      } else {
        try {
          const reader = new BrowserMultiFormatReader()
          const result = reader.decodeFromCanvas(canvas)
          resolve(result.getText())
        } catch {
          reject(new Error('No barcode found'))
        }
      }
    }
    img.onerror = reject
    img.src = url
  })
}

// Live-Scanner (Android/Desktop)
function LiveScanner({ onResult, onClose, t }) {
  const videoRef    = useRef(null)
  const streamRef   = useRef(null)
  const intervalRef = useRef(null)
  const doneRef     = useRef(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const useNative = 'BarcodeDetector' in window

  useState(() => {
    startCamera()
    return cleanup
  })

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setReady(true)

      if (useNative) {
        const detector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code']
        })
        intervalRef.current = setInterval(async () => {
          if (doneRef.current || !videoRef.current || videoRef.current.readyState < 2) return
          try {
            const barcodes = await detector.detect(videoRef.current)
            if (barcodes.length > 0) { doneRef.current = true; cleanup(); onResult(barcodes[0].rawValue) }
          } catch {}
        }, 200)
      } else {
        const { BrowserMultiFormatReader, NotFoundException } = await import('@zxing/library')
        const reader = new BrowserMultiFormatReader()
        intervalRef.current = setInterval(() => {
          if (doneRef.current || !videoRef.current || videoRef.current.readyState < 2) return
          try {
            const result = reader.decodeFromVideoElement(videoRef.current)
            if (result) { doneRef.current = true; cleanup(); onResult(result.getText()) }
          } catch {}
        }, 200)
      }
    } catch {
      setError(t.barcodeCameraError ?? 'Kamera konnte nicht gestartet werden.')
    }
  }

  function cleanup() {
    clearInterval(intervalRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  return (
    <div className="flex-1 relative overflow-hidden">
      <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        playsInline muted />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-40 relative">
          <div className="absolute inset-0 border border-white/30 rounded-2xl" />
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary-400 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-400 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary-400 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-400 rounded-br-xl" />
          {ready && <div className="absolute left-4 right-4 h-0.5 bg-primary-400/80 top-1/2 animate-[bounce_1.5s_ease-in-out_infinite]" />}
        </div>
      </div>
      {error && <div className="absolute bottom-8 left-4 right-4 bg-red-500/90 text-white rounded-xl px-4 py-3 text-sm text-center">{error}</div>}
    </div>
  )
}

export default function BarcodeScanner({ onResult, onClose }) {
  const { t } = useTranslation()
  const fileRef = useRef(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    setError('')
    try {
      const barcode = await scanImageFile(file)
      onClose()
      onResult(barcode)
    } catch {
      setError(t.barcodeNotFound ?? 'Kein Barcode gefunden. Bitte erneut versuchen.')
      setScanning(false)
    }
  }

  // iOS: Foto-basierter Scanner
  if (isIOS) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 shrink-0">
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center text-xl">×</button>
          <p className="text-white text-sm font-medium">{t.barcodeScanTitle ?? 'Barcode scannen'}</p>
          <div className="w-9" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
          <div className="text-6xl">📷</div>
          <p className="text-white text-center text-sm leading-relaxed">
            {t.barcodeIosHint ?? 'Fotografiere den Barcode mit der Kamera. Das Bild wird automatisch ausgewertet.'}
          </p>
          {error && (
            <div className="bg-red-500/90 text-white rounded-xl px-4 py-3 text-sm text-center w-full">
              {error}
            </div>
          )}
          <button onClick={() => fileRef.current?.click()}
            disabled={scanning}
            className="w-full py-4 rounded-2xl bg-primary-500 text-white font-semibold
              text-lg flex items-center justify-center gap-3 disabled:opacity-50">
            {scanning ? (
              <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t.barcodeScanning ?? 'Analysiere…'}</>
            ) : (
              <><span>📸</span> {t.barcodeTakePhoto ?? 'Foto aufnehmen'}</>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment"
            className="hidden" onChange={handleFile} />
        </div>
      </div>
    )
  }

  // Android/Desktop: Live-Scanner
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <button onClick={onClose}
          className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center text-xl">×</button>
        <p className="text-white text-sm font-medium">{t.barcodeScanTitle ?? 'Barcode scannen'}</p>
        <div className="w-9" />
      </div>
      <LiveScanner onResult={onResult} onClose={onClose} t={t} />
      <div className="px-4 py-4 text-center shrink-0">
        <p className="text-white/60 text-xs">{t.barcodeCameraHint ?? 'Halte den Barcode in den Rahmen'}</p>
      </div>
    </div>
  )
}
