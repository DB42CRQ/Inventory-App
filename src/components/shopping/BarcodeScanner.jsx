import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '../../i18n/useTranslation'

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
const useNative = 'BarcodeDetector' in window


function AIScanner({ onResult, onClose, inventoryItems, t, isIOS }) {
  const videoRef   = useRef(null)
  const streamRef  = useRef(null)
  const fileRef    = useRef(null)
  const [ready,    setReady]    = useState(false)
  const [scanning, setScanning] = useState(false)
  const [error,    setError]    = useState('')
  const [debugMsg, setDebugMsg] = useState('')

  useEffect(() => {
    if (!isIOS) startPreview()
    return () => streamRef.current?.getTracks().forEach(t => t.stop())
  }, [])

  async function startPreview() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      videoRef.current.playsInline = true
      videoRef.current.muted = true
      await videoRef.current.play()
      setReady(true)
    } catch {
      setError(t.barcodeCameraError ?? 'Kamera konnte nicht gestartet werden.')
    }
  }

  async function takeSnapshot() {
    setScanning(true)
    setError('')
    try {
      const video = videoRef.current
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d').drawImage(video, 0, 0)
      const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1]
      await analyzeImage(base64)
    } catch (err) {
      setError(t.barcodeNotFound ?? 'Kein Produkt erkannt. Bitte erneut versuchen.')
      setDebugMsg('ERR:' + err.message)
      setScanning(false)
    }
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    setError('')
    try {
      const dataUrl = await new Promise((res, rej) => {
        const reader = new FileReader()
        reader.onload = ev => res(ev.target.result)
        reader.onerror = rej
        reader.readAsDataURL(file)
      })
      const img = new Image()
      img.src = dataUrl
      await new Promise(r => { img.onload = r })
      const maxSize = 1280
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1]
      await analyzeImage(base64)
    } catch (err) {
      setError(t.barcodeNotFound ?? 'Kein Produkt erkannt. Bitte erneut versuchen.')
      setDebugMsg('ERR:' + err.message)
      setScanning(false)
    }
  }

  async function analyzeImage(base64) {
    setDebugMsg('calling AI...')
    const response = await fetch('/api/scan-barcode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64, inventoryItems })
    })
    const data = await response.json()
    setDebugMsg(`product:${data.productName} match:${data.matchedItem}`)
    if (data.error) throw new Error(data.error)
    if (!data.productName || data.productName === 'none') throw new Error('not found')
    streamRef.current?.getTracks().forEach(t => t.stop())
    onResult({ productName: data.productName, matchedItemName: data.matchedItem })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <button onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); onClose() }}
          className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center text-xl">×</button>
        <p className="text-white text-sm font-medium">{t.scanModeAI ?? 'KI-Produkterkennung'}</p>
        <div className="w-9" />
      </div>

      {isIOS ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
          <div className="text-7xl">📷</div>
          <p className="text-white text-center text-sm leading-relaxed opacity-80">
            {t.barcodeIosHint ?? 'Fotografiere das Produkt — die KI erkennt es automatisch.'}
          </p>

          {error && <div className="bg-red-500/90 text-white rounded-2xl px-4 py-3 text-sm text-center w-full">{error}</div>}
          <label className={`w-full py-4 rounded-2xl bg-primary-500 text-white font-semibold text-lg flex items-center justify-center gap-3 active:scale-95 transition-all ${scanning ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}>
            {scanning ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />{t.barcodeScanning ?? 'Analysiere…'}</> : <><span>📸</span>{t.barcodeTakePhoto ?? 'Foto aufnehmen'}</>}
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} disabled={scanning} />
          </label>
        </div>
      ) : (
        <>
          <div className="flex-1 relative overflow-hidden">
            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} playsInline muted />
            {!ready && <div className="absolute inset-0 flex items-center justify-center"><p className="text-white/60 text-sm">{t.barcodeCameraStarting ?? 'Kamera wird gestartet…'}</p></div>}

            {error && <div className="absolute bottom-4 left-4 right-4 bg-red-500/90 text-white rounded-xl px-4 py-3 text-sm text-center">{error}</div>}
          </div>
          <div className="px-4 py-4 shrink-0">
            <button onClick={takeSnapshot} disabled={!ready || scanning}
              className="w-full py-4 rounded-2xl bg-primary-500 text-white font-semibold text-lg flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 transition-all">
              {scanning ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />{t.barcodeScanning ?? 'Analysiere…'}</> : <><span>📸</span>{t.barcodeTakePhoto ?? 'Foto aufnehmen'}</>}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function BarcodeScanner({ onResult, onClose, inventoryItems = [], scanMode = 'barcode' }) {
  const { t } = useTranslation()
  const videoRef    = useRef(null)
  const streamRef   = useRef(null)
  const intervalRef = useRef(null)
  const doneRef     = useRef(false)
  const [error,    setError]    = useState('')
  const [ready,    setReady]    = useState(false)
  const [scanning, setScanning] = useState(false)
  const [debugMsg, setDebugMsg] = useState('')

  const useAI = isIOS || scanMode === 'ai'

  useEffect(() => {
    if (!useAI) {
      startCamera()
      return cleanup
    }
  }, [])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      })
      streamRef.current = stream
      const video = videoRef.current
      video.srcObject = stream
      video.playsInline = true
      video.muted = true
      await video.play()
      setReady(true)
      startScanning()
    } catch {
      setError(t.barcodeCameraError ?? 'Kamera konnte nicht gestartet werden.')
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
          if (barcodes.length > 0) { doneRef.current = true; cleanup(); onResult(barcodes[0].rawValue) }
        } catch {}
      }, 300)
    } else {
      import('@zxing/library').then(({ BrowserMultiFormatReader, NotFoundException, ChecksumException, FormatException }) => {
        const reader = new BrowserMultiFormatReader()
        intervalRef.current = setInterval(() => {
          if (doneRef.current || !videoRef.current || videoRef.current.readyState < 2) return
          try {
            const result = reader.decodeFromVideoElement(videoRef.current)
            if (result) { doneRef.current = true; cleanup(); onResult(result.getText()) }
          } catch (e) {
            if (!(e instanceof NotFoundException) && !(e instanceof ChecksumException) && !(e instanceof FormatException)) {}
          }
        }, 300)
      })
    }
  }

  function cleanup() {
    clearInterval(intervalRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const dbg = `type:${file.type} size:${file.size} native:${useNative}`
    setDebugMsg(dbg + ' loading...')
    setScanning(true)
    setError('')
    try {
      // FileReader statt createImageBitmap (iOS-kompatibler)
      const dataUrl = await new Promise((res, rej) => {
        const reader = new FileReader()
        reader.onload = ev => res(ev.target.result)
        reader.onerror = rej
        reader.readAsDataURL(file)
      })
      const img = new Image()
      img.src = dataUrl
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej })
      setDebugMsg(dbg + ` img(${img.width}x${img.height})`)

      // Auf max 1280px skalieren
      const maxSize = 1280
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      setDebugMsg(dbg + ` scaled:${w}x${h}`)

      // Anthropic API: Produktname + Match direkt
      setDebugMsg(dbg + ` scaled:${w}x${h} calling AI...`)
      const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1]
      const response = await fetch('/api/scan-barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, inventoryItems })
      })
      const data = await response.json()
      setDebugMsg(dbg + ` scaled:${w}x${h} product:${data.productName} match:${data.matchedItem} err:${data.error}`)
      if (data.error) throw new Error(data.error)
      if (!data.productName || data.productName === 'none') throw new Error('not found')
      // onResult first, then onClose to avoid unmount crash
      onResult({ productName: data.productName, matchedItemName: data.matchedItem })
      onClose()
    } catch (err) {
      setDebugMsg(prev => prev + ' ERR:' + (err?.message || 'unknown'))
      setError(t.barcodeNotFound ?? 'Kein Barcode gefunden. Bitte erneut versuchen.')
      setScanning(false)
    }
  }

  if (useAI) {
    return <AIScanner onResult={onResult} onClose={onClose} inventoryItems={inventoryItems} t={t} isIOS={isIOS} />
  }

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
          playsInline muted autoPlay />
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
