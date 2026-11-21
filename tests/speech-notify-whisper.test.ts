import { afterEach, describe, expect, it, vi } from 'vitest';
import { notify, notificationPermission, requestNotificationPermission } from '@/lib/local/notify';
import { pickVoice, speechRecognitionSupported, speechSynthesisSupported, startDictation } from '@/lib/local/speech';
import { mixToMono, resampleLinear } from '@/lib/local/whisper';

afterEach(() => vi.unstubAllGlobals());

describe('speech feature detection', () => {
  it('reports unsupported without window', () => {
    expect(speechRecognitionSupported()).toBe(false);
    expect(speechSynthesisSupported()).toBe(false);
    expect(startDictation({ onText: () => {} })).toBeNull();
  });

  it('runs dictation through a (webkit) SpeechRecognition and stops cleanly', () => {
    const instances: any[] = [];
    class FakeRec {
      started = false; stopped = false; onresult: any; onerror: any; onend: any;
      constructor() { instances.push(this); }
      start() { this.started = true; }
      stop() { this.stopped = true; this.onend?.(); }
    }
    vi.stubGlobal('window', { webkitSpeechRecognition: FakeRec });
    const texts: [string, boolean][] = [];
    let ended = false;
    const stop = startDictation({ onText: (t, f) => texts.push([t, f]), onEnd: () => { ended = true; } }, 'fr-FR')!;
    const rec = instances[0];
    expect(rec.started).toBe(true);
    expect(rec.lang).toBe('fr-FR');
    rec.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: 'hello' }], { isFinal: false })] });
    rec.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: 'hello world' }], { isFinal: true })] });
    expect(texts).toEqual([['hello', false], ['hello world', true]]);
    stop();
    expect(rec.stopped && ended).toBe(true);
  });

  it('maps permission errors to a friendly message', () => {
    let inst: any;
    vi.stubGlobal('window', { SpeechRecognition: class { constructor() { inst = this; } start() {} stop() {} } });
    let msg = '';
    startDictation({ onText: () => {}, onError: (m) => { msg = m; } });
    inst.onerror({ error: 'not-allowed' });
    expect(msg).toMatch(/permission/i);
  });

  it('prefers local voices for the language', () => {
    const voices = [{ lang: 'en-GB', localService: false, name: 'remote' }, { lang: 'en-US', localService: true, name: 'local' }, { lang: 'fr-FR', localService: true, name: 'fr' }] as any;
    expect(pickVoice(voices, 'en')!.name).toBe('local');
    expect(pickVoice(voices, 'de')).toBeUndefined();
  });
});

describe('notifications', () => {
  it('is a no-op when unsupported', async () => {
    expect(notificationPermission()).toBe('unsupported');
    expect(await requestNotificationPermission()).toBe('unsupported');
    expect(notify('t', 'b')).toBe(false);
  });

  it('only notifies when granted, and skips while the tab is focused by default', () => {
    const shown: string[] = [];
    class N { static permission = 'granted'; constructor(title: string) { shown.push(title); } close() {} }
    vi.stubGlobal('window', { Notification: N, focus() {} });
    vi.stubGlobal('Notification', N);
    vi.stubGlobal('document', { visibilityState: 'visible', hasFocus: () => true });
    expect(notify('Done', 'ready')).toBe(false);
    expect(notify('Done', 'ready', { onlyWhenHidden: false })).toBe(true);
    vi.stubGlobal('document', { visibilityState: 'hidden', hasFocus: () => false });
    expect(notify('Hidden', 'ready')).toBe(true);
    expect(shown).toEqual(['Done', 'Hidden']);
    (N as any).permission = 'denied';
    expect(notify('x', 'y', { onlyWhenHidden: false })).toBe(false);
  });
});

describe('whisper audio helpers', () => {
  it('mixes channels to mono', () => {
    const mono = mixToMono([new Float32Array([1, 0, -1]), new Float32Array([0, 1, -1])]);
    expect(Array.from(mono)).toEqual([0.5, 0.5, -1]);
  });
  it('resamples to the target length with interpolation', () => {
    const out = resampleLinear(new Float32Array([0, 1, 2, 3]), 4, 2);
    expect(out.length).toBe(2);
    expect(out[0]).toBe(0);
    expect(out[1]).toBeCloseTo(2);
    expect(resampleLinear(new Float32Array([1, 2]), 8, 8).length).toBe(2);
  });
});
