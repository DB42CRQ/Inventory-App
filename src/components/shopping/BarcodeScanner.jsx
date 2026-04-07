import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, NotFoundException, ChecksumException, FormatException } from '@zxing/library'

export default function BarcodeScanner({ onResult, onClose }) {
  const videoRef    = useRef(null)
  const streamRef   = useRef(null)
  const intervalRef = useRef(null)
  const doneRef     = useRef(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const useNative = 'BarcodeDetector' in window

    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width:  { ideal: 1280 },
        height: { ideal: 720 },
      }
    }).then(stream => {
      streamRef.current = stream
      videoRef.current.srcObject = stream

      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play()
        setReady(true)

        if (useNative) {
          // Native BarcodeDetector (Chrome Android)
          const detector = new window.BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code']
          })
          intervalRef.current = setInterval(async () => {
            if (doneRef.current || videoRef.current?.readyState < 2) return
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
          // @zxing Fallback (Laptop / Firefox)
          const reader = new BrowserMultiFormatReader()
          intervalRef.current = setInterval(() => {
            if (doneRef.current || videoRef.current?.readyState < 2) return
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
                console.warn('zxing error:', e)
              }
            }
          }, 200)
        }
      }
    }).catch(() => {
      setError('Kamera konnte nicht gestartet werden. Bitte Berechtigung prüfen.')
    })

    function cleanup() {
      clearInterval(intervalRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }

    return cleanup
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <button onClick={onClose}
          className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center text-xl">
          ×
        </button>
        <p className="text-white text-sm font-medium">Barcode scannen</p>
        <div className="w-9" />
      </div>

      <div className="flex-1 relative overflow-hidden">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

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
          {ready ? 'Halte den Barcode in den Rahmen' : 'Kamera wird gestartet…'}
        </p>
      </div>
    </div>
  )
}
