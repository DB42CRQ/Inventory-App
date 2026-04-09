import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import { BrowserMultiFormatReader, NotFoundException, ChecksumException, FormatException } from '@zxing/library'

export default function BarcodeScanner({ onResult, onClose }) {
  const { t } = useTranslation()
  const videoRef    = useRef(null)
  const streamRef   = useRef(null)
  const intervalRef = useRef(null)
  const watchRef    = useRef(null)
  const doneRef     = useRef(false)
  const lastTimeRef = useRef(0)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const useNative = !isIOS && 'BarcodeDetector' in window

  useEffect(() => {
    startCamera()
    return cleanup
  }, [])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      const video = videoRef.current
      video.srcObject = stream
      video.playsInline = true
      video.muted = true

      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve
        video.onerror = reject
        setTimeout(reject, 5000)
      })

      await video.play()
      setReady(true)
      startScanning()

      // iOS: Watchdog der den Stream überwacht und neu startet
      if (isIOS) {
        watchRef.current = setInterval(() => {
          if (doneRef.current) return
          const v = videoRef.current
          if (!v) return
          if (v.paused || v.ended) {
            v.play().catch(() => {})
          }
          // Prüfe ob currentTime sich verändert (Stream läuft)
          if (v.currentTime === lastTimeRef.current && !v.paused) {
            // Stream hängt — neu starten
            v.srcObject = streamRef.current
            v.play().catch(() => {})
          }
          lastTimeRef.current = v.currentTime
        }, 500)
      }
    } catch (err) {
      console.error('Camera error:', err)
      // Fallback ohne facingMode
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        streamRef.current = stream
        videoRef.current.srcObject = stream
        videoRef.current.playsInline = true
        videoRef.current.muted = true
        await videoRef.current.play()
        setReady(true)
        startScanning()
      } catch {
        setError(t.barcodeCameraError ?? 'Kamera konnte nicht gestartet werden.')
      }
    }
  }

  function startScanning() {
    if (useNative) {
      const detector = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code']
      })
      intervalRef.current = setInterval(async () => {
        if (doneRef.current || !videoRef.current || videoRef.current.readyState < 2) return
        try {
          const barcodes = await detector.detect(videoRef.current)
          if (barcodes.length > 0) {
            doneRef.current = true
            cleanup()
            onResult(barcodes[0].rawValue)
          }
        } catch {}
      }, 200)
    } else {
      const reader = new BrowserMultiFormatReader()
      intervalRef.current = setInterval(() => {
        if (doneRef.current || !videoRef.current || videoRef.current.readyState < 2) return
        try {
          const result = reader.decodeFromVideoElement(videoRef.current)
          if (result) {
            doneRef.current = true
            cleanup()
            onResult(result.getText())
          }
        } catch (e) {
          if (!(e instanceof NotFoundException) &&
              !(e instanceof ChecksumException) &&
              !(e instanceof FormatException)) {
            // ignore
          }
        }
      }, 200)
    }
  }

  function cleanup() {
    clearInterval(intervalRef.current)
    clearInterval(watchRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <button onClick={() => { cleanup(); onClose() }}
          className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center text-xl">
          ×
        </button>
        <p className="text-white text-sm font-medium">{t.barcodeScanTitle ?? 'Barcode scannen'}</p>
        <div className="w-9" />
      </div>

      <div className="flex-1 relative overflow-hidden">
        <video ref={videoRef}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-40 relative">
            <div className="absolute inset-0 border border-white/30 rounded-2xl" />
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary-400 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-400 rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary-400 rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-400 rounded-br-xl" />
            {ready && (
              <div className="absolute left-4 right-4 h-0.5 bg-primary-400/80 top-1/2
                animate-[bounce_1.5s_ease-in-out_infinite]" />
            )}
          </div>
        </div>

        {error && (
          <div className="absolute bottom-8 left-4 right-4 bg-red-500/90 text-white
            rounded-xl px-4 py-3 text-sm text-center">{error}</div>
        )}
      </div>

      <div className="px-4 py-4 text-center shrink-0">
        <p className="text-white/60 text-xs">
          {ready
            ? (t.barcodeCameraHint ?? 'Halte den Barcode in den Rahmen')
            : (t.barcodeCameraStarting ?? 'Kamera wird gestartet…')}
        </p>
      </div>
    </div>
  )
}
