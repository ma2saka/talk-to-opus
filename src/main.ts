import './style.css'

const appRoot = document.querySelector<HTMLDivElement>('#app')

if (!appRoot) {
  throw new Error('#app root element is missing')
}

function queryRequired<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector)
  if (!element) {
    throw new Error(`${selector} を取得できませんでした`)
  }
  return element
}

appRoot.innerHTML = `
  <main class="recorder">
    <header>
      <h1>ブラウザ録音 (Opus)</h1>
      <p class="description">
        マイクの音声をブラウザだけで録音し、完了時に Opus 形式でダウンロードします。
      </p>
    </header>
    <section class="status-panel">
      <p id="statusText" aria-live="polite">録音待機中</p>
      <p id="mimeText" class="hint" aria-live="polite"></p>
    </section>
    <section class="controls">
      <button id="recordButton" type="button">録音</button>
      <button id="finishButton" type="button" disabled>完了</button>
    </section>
    <p class="hint">
      初回はマイク使用許可のダイアログが表示されます。録音を完了すると、ブラウザが自動的にファイルをダウンロードします。
    </p>
  </main>
`

const statusText = queryRequired<HTMLParagraphElement>('#statusText')
const mimeText = queryRequired<HTMLParagraphElement>('#mimeText')
const recordButton = queryRequired<HTMLButtonElement>('#recordButton')
const finishButton = queryRequired<HTMLButtonElement>('#finishButton')

const supportedMimeTypes = [
  'audio/ogg;codecs=opus',
  'audio/webm;codecs=opus',
  'audio/ogg',
  'audio/webm'
]

let activeStream: MediaStream | null = null
let mediaRecorder: MediaRecorder | null = null
let recordedChunks: BlobPart[] = []
let selectedMimeType: string | undefined
let downloadUrl: string | null = null

const hasMediaDevices = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices)
const hasMediaRecorder = typeof window !== 'undefined' && 'MediaRecorder' in window
const isRecordingSupported = hasMediaDevices && hasMediaRecorder

if (!isRecordingSupported) {
  statusText.textContent = 'このブラウザは録音に対応していません'
  recordButton.disabled = true
  finishButton.disabled = true
}

function setStatus(message: string) {
  statusText.textContent = message
}

function setButtons(state: 'idle' | 'recording' | 'saving') {
  if (state === 'idle') {
    recordButton.disabled = false
    finishButton.disabled = true
  } else if (state === 'recording') {
    recordButton.disabled = true
    finishButton.disabled = false
  } else {
    recordButton.disabled = true
    finishButton.disabled = true
  }
}

function cleanupStream() {
  activeStream?.getTracks().forEach((track) => track.stop())
  activeStream = null
}

function determineMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') {
    return undefined
  }

  return supportedMimeTypes.find((type) => MediaRecorder.isTypeSupported(type))
}

async function startRecording() {
  if (!isRecordingSupported || mediaRecorder?.state === 'recording') {
    return
  }

  try {
    setStatus('マイクを準備しています…')
    setButtons('saving')

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    activeStream = stream
    selectedMimeType = determineMimeType()
    recordedChunks = []

    mediaRecorder = new MediaRecorder(
      stream,
      selectedMimeType ? { mimeType: selectedMimeType } : undefined
    )

    mimeText.textContent = selectedMimeType
      ? `利用中のコーデック: ${selectedMimeType}`
      : '利用可能な Opus コーデックを確認できませんでした'

    mediaRecorder.addEventListener('dataavailable', (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data)
      }
    })

    mediaRecorder.addEventListener(
      'stop',
      () => {
        finalizeRecording()
      },
      { once: true }
    )

    mediaRecorder.start()
    setStatus('録音中… 完了ボタンで停止します')
    setButtons('recording')
  } catch (error) {
    console.error(error)
    cleanupStream()
    mediaRecorder = null
    recordedChunks = []
    setStatus('録音を開始できませんでした。マイク権限やデバイス設定を確認してください')
    setButtons('idle')
  }
}

function triggerDownload(blob: Blob) {
  if (downloadUrl) {
    URL.revokeObjectURL(downloadUrl)
  }

  downloadUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
  anchor.href = downloadUrl
  anchor.download = `recording-${timestamp}.opus`
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}

function finalizeRecording() {
  const blobType = selectedMimeType ?? 'audio/webm;codecs=opus'

  cleanupStream()

  if (!recordedChunks.length) {
    setStatus('録音データが取得できませんでした。もう一度お試しください')
    setButtons('idle')
    return
  }

  const blob = new Blob(recordedChunks, { type: blobType })
  triggerDownload(blob)

  setStatus('録音データをダウンロードしました')
  setButtons('idle')
  mediaRecorder = null
  recordedChunks = []
}

function stopRecording() {
  if (!mediaRecorder) {
    setStatus('録音が開始されていません')
    return
  }

  if (mediaRecorder.state === 'inactive') {
    setStatus('録音データは既に処理済みです')
    return
  }

  setStatus('録音を停止しています…')
  setButtons('saving')
  mediaRecorder.stop()
}

recordButton?.addEventListener('click', () => {
  startRecording()
})

finishButton?.addEventListener('click', () => {
  stopRecording()
})

window.addEventListener('beforeunload', () => {
  if (downloadUrl) {
    URL.revokeObjectURL(downloadUrl)
  }
})
