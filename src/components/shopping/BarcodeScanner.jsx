import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import { BrowserMultiFormatReader, NotFoundException, ChecksumException, FormatException } from '@zxing/library'

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
const useNative = 'BarcodeDetector' in window

export default function BarcodeScanner({ onResult, onClose }) {
  const { t } = useTranslation()
  const videoRef    = useRef(null)
  const streamRef   = useRef(null)
  const intervalRef = useRef(null)
  const doneRef     = useRef(false)
  const fileRef     = useRef(null)
  const [error,    setError]    = useState('')
  const [ready,    setReady]    = useState(false)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    startLiveCamera()
    return cleanup
  }, [])

  // Live-Kamera (Android/Desktop/iOS Safari)
  async function startLiveCamera() {
    try {
      // Erst alle verfügbaren Kameras auflisten
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(d => d.kind === 'videoinput')

      // Rückkamera bevorzugen aber nicht erzwingen
      const backCamera = videoDevices.find(d =>
        d.label.toLowerCase().includes('back') ||
        d.label.toLowerCase().includes('rear') ||
        d.label.toLowerCase().includes('environment')
      )

      // iOS: zuerst ohne facingMode versuchen, dann mit
      let stream
      if (isIOS) {
        if (backCamera) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: backCamera.deviceId } }
          })
        } else {
          // Alle Kameras durchprobieren bis eine stabil läuft
          stream = await navigator.mediaDevices.getUserMedia({ video: true })
        }
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
        })
      }
      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setReady(true)

      // iOS: aggressiver play() Keepalive
      if (isIOS) {
        const keepAlive = setInterval(() => {
          const v = videoRef.current
          if (!v || doneRef.current) { clearInterval(keepAlive); return }
          if (v.paused || v.readyState < 3) {
            v.play().catch(() => {})
          }
        }, 100)
      }

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
        const reader = new BrowserMultiFormatReader()
        intervalRef.current = setInterval(() => {
          if (doneRef.current || !videoRef.current || videoRef.current.readyState < 2) return
          try {
            const result = reader.decodeFromVideoElement(videoRef.current)
            if (result) { doneRef.current = true; cleanup(); onResult(result.getText()) }
          } catch (e) {
            if (!(e instanceof NotFoundException) && !(e instanceof ChecksumException) && !(e instanceof FormatException)) {}
          }
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

  // iOS: Foto aufnehmen und analysieren
  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    setError('')

    try {
      const bitmap = await createImageBitmap(file)

      if (useNative) {
        // iOS 17+ hat BarcodeDetector
        const detector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code']
        })
        const barcodes = await detector.detect(bitmap)
        if (barcodes.length > 0) {
          onClose()
          onResult(barcodes[0].rawValue)
          return
        }
      } else {
        // Fallback: Canvas + @zxing
        const canvas = document.createElement('canvas')
        canvas.width = bitmap.width
        canvas.height = bitmap.height
        canvas.getContext('2d').drawImage(bitmap, 0, 0)
        const reader = new BrowserMultiFormatReader()
        const result = reader.decodeFromCanvas(canvas)
        onClose()
        onResult(result.getText())
        return
      }
      throw new Error('No barcode found')
    } catch {
      setError(t.barcodeNotFound ?? 'Kein Barcode gefunden. Bitte erneut versuchen.')
      setScanning(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  // iOS Photo Screen (disabled - using live scanner)
  if (false) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 shrink-0">
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center text-xl">×</button>
          <p className="text-white text-sm font-medium">{t.barcodeScanTitle ?? 'Barcode scannen'}</p>
          <div className="w-9" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
          <div className="text-7xl">📷</div>
          <p className="text-white text-center text-sm leading-relaxed opacity-80">
            {t.barcodeIosHint ?? 'Fotografiere den Barcode. Das Bild wird automatisch ausgewertet.'}
          </p>
          {error && (
            <div className="bg-red-500/90 text-white rounded-2xl px-4 py-3 text-sm text-center w-full">
              {error}
            </div>
          )}
          <button onClick={() => fileRef.current?.click()} disabled={scanning}
            className="w-full py-4 rounded-2xl bg-primary-500 text-white font-semibold
              text-lg flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 transition-all">
            {scanning ? (
              <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t.barcodeScanning ?? 'Analysiere…'}</>
            ) : (
              <><span>📸</span>{t.barcodeTakePhoto ?? 'Foto aufnehmen'}</>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment"
            className="hidden" onChange={handleFile} />
        </div>
      </div>
    )
  }

  // Android/Desktop Screen
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <button onClick={() => { cleanup(); onClose() }}
          className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center text-xl">×</button>
        <p className="text-white text-sm font-medium">{t.barcodeScanTitle ?? 'Barcode scannen'}</p>
        <div className="w-9" />
      </div>
      <div className="flex-1 relative overflow-hidden">
        <video ref={videoRef}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
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
      <div className="px-4 py-4 text-center shrink-0">
        <p className="text-white/60 text-xs">
          {ready ? (t.barcodeCameraHint ?? 'Halte den Barcode in den Rahmen') : (t.barcodeCameraStarting ?? 'Kamera wird gestartet…')}
        </p>
      </div>
    </div>
  )
}
