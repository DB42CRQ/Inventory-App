import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'

export default function BarcodeScanner({ onResult, onClose }) {
  const videoRef    = useRef(null)
  const readerRef   = useRef(null)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(true)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader

    reader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
      if (result && scanning) {
        setScanning(false)
        onResult(result.getText())
      }
    }).catch(e => {
      setError('Kamera konnte nicht gestartet werden.')
    })

    return () => {
      try { BrowserMultiFormatReader.releaseAllStreams() } catch {}
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <button onClick={onClose}
          className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center text-lg">
          ×
        </button>
        <p className="text-white text-sm font-medium">Barcode scannen</p>
        <div className="w-9" />
      </div>

      {/* Kamera */}
      <div className="flex-1 relative overflow-hidden">
        <video ref={videoRef} className="w-full h-full object-cover" />

        {/* Fadenkreuz */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-40 border-2 border-white rounded-2xl relative">
            {/* Ecken */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary-400 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary-400 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary-400 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary-400 rounded-br-lg" />
            {/* Scan-Linie */}
            {scanning && (
              <div className="absolute left-2 right-2 h-0.5 bg-primary-400 animate-bounce top-1/2" />
            )}
          </div>
        </div>

        {error && (
          <div className="absolute bottom-8 left-4 right-4 bg-red-500 text-white rounded-xl px-4 py-3 text-sm text-center">
            {error}
          </div>
        )}
      </div>

      <div className="px-4 py-4 text-center shrink-0">
        <p className="text-white/60 text-xs">Halte den Barcode in den Rahmen</p>
      </div>
    </div>
  )
}
