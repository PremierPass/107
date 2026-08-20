import io
import json
import os
import subprocess
import threading
import time
import wave
from collections import deque
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from openai import OpenAI

SAMPLE_RATE = 16000
CHANNELS = 1
SAMPLE_WIDTH = 2
CHUNK_SECONDS = int(os.getenv("CHUNK_SECONDS", "5"))
BUFFER_SECONDS = 120
BUFFER_CHUNKS = max(1, BUFFER_SECONDS // CHUNK_SECONDS)
AUTO_STOP_SECONDS = int(os.getenv("AUTO_STOP_SECONDS", "600"))
MODEL = os.getenv("TRANSCRIBE_MODEL", "gpt-4o-mini-transcribe")
FEED_ID = "47584"
STREAM_URL = os.getenv("HLS_STREAM_URL", "").strip()
RECORDINGS_DIR = Path(os.getenv("RECORDINGS_DIR", "recordings"))
RECORDINGS_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_TRIGGERS = [
    "shots fired", "officer down", "officer needs assistance", "officer needs help",
    "pursuit", "vehicle pursuit", "foot pursuit", "structure fire", "working fire",
    "fully involved", "mayday", "cpr in progress", "cardiac arrest", "air medical",
    "helicopter requested", "major accident", "mass casualty", "active shooter",
    "stabbing", "shooting", "armed robbery", "barricaded", "hostage"
]
TRIGGERS = [x.strip().lower() for x in os.getenv("AUTO_RECORD_TRIGGERS", ",".join(DEFAULT_TRIGGERS)).split(",") if x.strip()]

app = FastAPI(title="Public Safety Radio Transcriber")
app.mount("/static", StaticFiles(directory="."), name="static")

lock = threading.RLock()
runner_thread = None
ffmpeg_proc = None
running = False
last_error = ""
transcripts = deque(maxlen=2000)
audio_buffer = deque(maxlen=BUFFER_CHUNKS)
recording = False
recording_reason = ""
recording_started_at = None
recording_pcm = bytearray()
recording_transcripts = []
last_activity_at = None


def event(kind, text, **extra):
    item = {
        "id": int(time.time() * 1000),
        "time": datetime.now().strftime("%H:%M:%S"),
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        "kind": kind,
        "text": text,
        **extra,
    }
    with lock:
        transcripts.append(item)
        if recording and kind == "transcript":
            recording_transcripts.append(item.copy())
    return item


def wav_bytes(pcm):
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(SAMPLE_WIDTH)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(pcm)
    return buf.getvalue()


def save_recording():
    global recording, recording_reason, recording_started_at, recording_pcm, recording_transcripts
    if not recording_pcm:
        recording = False
        return None
    now = datetime.now()
    stamp = now.strftime("%Y-%m-%d_%H-%M-%S")
    safe_reason = "".join(c if c.isalnum() or c in "-_" else "-" for c in recording_reason)[:60].strip("-") or "event"
    folder = RECORDINGS_DIR / f"{stamp}_{safe_reason}"
    folder.mkdir(parents=True, exist_ok=True)
    wav_path = folder / "audio.wav"
    txt_path = folder / "transcript.txt"
    meta_path = folder / "metadata.json"
    wav_path.write_bytes(wav_bytes(bytes(recording_pcm)))
    lines = [f"{x['timestamp']}  {x['text']}" for x in recording_transcripts]
    txt_path.write_text("\n".join(lines), encoding="utf-8")
    metadata = {
        "feed_id": FEED_ID,
        "reason": recording_reason,
        "recording_started_at": recording_started_at,
        "saved_at": now.isoformat(timespec="seconds"),
        "pre_event_buffer_seconds": BUFFER_SECONDS,
        "transcript_lines": len(recording_transcripts),
        "audio_file": wav_path.name,
        "transcript_file": txt_path.name,
    }
    meta_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    recording = False
    recording_reason = ""
    recording_started_at = None
    recording_pcm = bytearray()
    recording_transcripts = []
    event("system", f"Recording saved: {folder.name}", folder=folder.name)
    return folder.name


def start_recording(reason="manual"):
    global recording, recording_reason, recording_started_at, recording_pcm, recording_transcripts, last_activity_at
    with lock:
        if recording:
            last_activity_at = time.time()
            return False
        recording = True
        recording_reason = reason
        recording_started_at = datetime.now().isoformat(timespec="seconds")
        recording_pcm = bytearray().join(audio_buffer)
        cutoff = time.time() - BUFFER_SECONDS
        recording_transcripts = [x.copy() for x in transcripts if x.get("kind") == "transcript" and x.get("epoch", 0) >= cutoff]
        last_activity_at = time.time()
    event("system", f"Recording started ({reason}) with 2-minute pre-event buffer.", recording=True)
    return True


def check_auto_trigger(text):
    t = text.lower()
    for phrase in TRIGGERS:
        if phrase in t:
            if not recording:
                start_recording(f"auto-{phrase}")
            return phrase
    return None


def transcribe(client, pcm):
    global last_activity_at
    audio = io.BytesIO(wav_bytes(pcm))
    audio.name = "radio.wav"
    result = client.audio.transcriptions.create(
        model=MODEL,
        file=audio,
        language="en",
        prompt=("Public safety scanner traffic from police, fire, EMS and dispatch. "
                "Expect unit numbers, street names, ten-codes, vehicle descriptions and clipped radio speech. "
                "Transcribe only audible speech. Do not invent missing words."),
    )
    text = (getattr(result, "text", "") or "").strip()
    if text:
        item = event("transcript", text, epoch=time.time())
        with lock:
            last_activity_at = time.time()
        check_auto_trigger(text)
        return item
    return None


def stream_loop():
    global ffmpeg_proc, running, last_error, recording_pcm
    key = os.getenv("OPENAI_API_KEY", "").strip()
    if not key:
        with lock:
            last_error = "OPENAI_API_KEY is not configured."
            running = False
        event("system", last_error)
        return
    if not STREAM_URL:
        with lock:
            last_error = "HLS_STREAM_URL is not configured on the server."
            running = False
        event("system", last_error)
        return
    client = OpenAI(api_key=key)
    cmd = [
        "ffmpeg", "-hide_banner", "-loglevel", "error",
        "-reconnect", "1", "-reconnect_streamed", "1", "-reconnect_delay_max", "5",
        "-i", STREAM_URL, "-vn", "-ac", str(CHANNELS), "-ar", str(SAMPLE_RATE),
        "-f", "s16le", "pipe:1"
    ]
    bytes_per_chunk = SAMPLE_RATE * CHANNELS * SAMPLE_WIDTH * CHUNK_SECONDS
    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, bufsize=0)
        with lock:
            ffmpeg_proc = proc
        event("system", f"Feed {FEED_ID} started. 2-minute rolling buffer active.")
        buf = bytearray()
        while True:
            with lock:
                if not running:
                    break
            data = proc.stdout.read(8192)
            if not data:
                if proc.poll() is not None:
                    err = proc.stderr.read().decode("utf-8", errors="ignore").strip()
                    raise RuntimeError(err or f"ffmpeg exited with code {proc.returncode}")
                time.sleep(0.05)
                continue
            buf.extend(data)
            while len(buf) >= bytes_per_chunk:
                pcm = bytes(buf[:bytes_per_chunk])
                del buf[:bytes_per_chunk]
                with lock:
                    audio_buffer.append(pcm)
                    if recording:
                        recording_pcm.extend(pcm)
                try:
                    transcribe(client, pcm)
                except Exception as e:
                    event("system", f"Transcription error: {type(e).__name__}: {e}")
                with lock:
                    should_stop = recording and last_activity_at and (time.time() - last_activity_at >= AUTO_STOP_SECONDS)
                if should_stop:
                    save_recording()
    except Exception as e:
        with lock:
            last_error = f"{type(e).__name__}: {e}"
        event("system", f"Stream error: {last_error}")
    finally:
        try:
            if ffmpeg_proc and ffmpeg_proc.poll() is None:
                ffmpeg_proc.terminate()
        except Exception:
            pass
        with lock:
            ffmpeg_proc = None
            running = False
        if recording:
            save_recording()


@app.get("/", response_class=HTMLResponse)
def home():
    return Path("index.html").read_text(encoding="utf-8")


@app.post("/api/start")
def api_start():
    global running, runner_thread, last_error
    with lock:
        if running:
            return {"ok": True, "already_running": True}
        running = True
        last_error = ""
    runner_thread = threading.Thread(target=stream_loop, daemon=True)
    runner_thread.start()
    return {"ok": True}


@app.post("/api/stop")
def api_stop():
    global running
    with lock:
        running = False
    event("system", "Scanner/transcription stopped by user.")
    return {"ok": True}


@app.post("/api/record/start")
def api_record_start():
    started = start_recording("manual")
    return {"ok": True, "started": started}


@app.post("/api/record/stop")
def api_record_stop():
    with lock:
        active = recording
    if not active:
        return {"ok": True, "recording": False}
    folder = save_recording()
    return {"ok": True, "recording": False, "folder": folder}


@app.get("/api/status")
def api_status():
    with lock:
        return {
            "running": running,
            "recording": recording,
            "recording_reason": recording_reason,
            "buffer_seconds": BUFFER_SECONDS,
            "auto_stop_seconds": AUTO_STOP_SECONDS,
            "feed_id": FEED_ID,
            "last_error": last_error,
            "trigger_count": len(TRIGGERS),
        }


@app.get("/api/recordings")
def api_recordings():
    items = []
    for folder in sorted(RECORDINGS_DIR.iterdir(), reverse=True) if RECORDINGS_DIR.exists() else []:
        if folder.is_dir():
            items.append({"name": folder.name})
    return items


@app.get("/api/recordings/{folder}/{filename}")
def download_recording(folder: str, filename: str):
    target = (RECORDINGS_DIR / folder / filename).resolve()
    base = RECORDINGS_DIR.resolve()
    if base not in target.parents or not target.exists():
        raise HTTPException(404)
    return FileResponse(target)


@app.get("/events")
def sse():
    def gen():
        last_id = 0
        while True:
            with lock:
                items = list(transcripts)
                status = {
                    "running": running,
                    "recording": recording,
                    "recording_reason": recording_reason,
                    "last_error": last_error,
                }
            for item in items:
                if item["id"] > last_id:
                    last_id = item["id"]
                    yield f"data: {json.dumps(item)}\n\n"
            yield f"event: status\ndata: {json.dumps(status)}\n\n"
            time.sleep(1)
    return StreamingResponse(gen(), media_type="text/event-stream")


@app.get("/health")
def health():
    return {"ok": True, "feed_id": FEED_ID}
