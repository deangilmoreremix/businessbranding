import { describe, expect, it } from 'vitest';
import { captionsFromSegments, captionsFromText, cuesToSrt, cuesToVtt, formatVttTime, groupCues, parseVttToCaptions, toVtt, wordCaptions } from '@/lib/local/captions';

describe('wordCaptions', () => {
  it('spreads words across the span proportionally and exactly fills it', () => {
    const caps = wordCaptions('Hi wonderful world', 1000, 4000);
    expect(caps.map((c) => c.text)).toEqual(['Hi', ' wonderful', ' world']);
    expect(caps[0].startMs).toBe(1000);
    expect(caps.at(-1)!.endMs).toBe(4000);
    expect(caps[1].endMs - caps[1].startMs).toBeGreaterThan(caps[0].endMs - caps[0].startMs);
    for (let i = 1; i < caps.length; i++) expect(caps[i].startMs).toBe(caps[i - 1].endMs);
  });
  it('returns nothing for empty text', () => expect(wordCaptions('  ', 0, 1000)).toEqual([]));
});

describe('groupCues', () => {
  it('breaks at sentence ends', () => {
    const cues = groupCues(captionsFromText('One two. Three four.', 4000));
    expect(cues.map((c) => c.text)).toEqual(['One two.', 'Three four.']);
  });
  it('wraps by maximum characters and duration', () => {
    const long = 'word '.repeat(30).trim();
    const cues = groupCues(captionsFromText(long, 30000), { maxChars: 20 });
    expect(cues.every((c) => c.text.length <= 20)).toBe(true);
    const slow = groupCues(captionsFromText('a b c d e f g h', 16000), { maxChars: 100, maxDurationMs: 4000 });
    expect(slow.length).toBeGreaterThan(2);
  });
  it('starts a new cue after a long pause (speaker change)', () => {
    const caps = captionsFromSegments([{ text: 'Hello there', durationMs: 1000 }, { text: 'Hi back', durationMs: 1000 }], 1500);
    expect(groupCues(caps).map((c) => c.text)).toEqual(['Hello there', 'Hi back']);
  });
});

describe('captionsFromSegments', () => {
  it('offsets each clip by the previous durations plus the join gap, skipping empty clips', () => {
    const caps = captionsFromSegments([{ text: 'A b', durationMs: 1000 }, { text: '', durationMs: 500 }, { text: 'C d', durationMs: 2000 }], 350);
    expect(caps[0].startMs).toBe(0);
    expect(caps.find((c) => c.text.trim() === 'C')!.startMs).toBe(1350);
    expect(caps.at(-1)!.endMs).toBe(3350);
  });
});

describe('WebVTT / SRT output', () => {
  it('formats timestamps', () => {
    expect(formatVttTime(3723004)).toBe('01:02:03.004');
    expect(formatVttTime(-5)).toBe('00:00:00.000');
  });
  it('writes a valid WebVTT document', () => {
    const vtt = toVtt(captionsFromText('Hello world. Second line here.', 6000));
    expect(vtt.startsWith('WEBVTT\n\n1\n00:00:00.000 --> ')).toBe(true);
    expect(vtt).toContain('\n2\n');
    expect(vtt).not.toContain(',');
  });
  it('escapes "-->" in cue text', () => {
    expect(cuesToVtt([{ startMs: 0, endMs: 1000, text: 'a --> b' }])).toContain('a → b');
  });
  it('writes SRT with comma milliseconds', () => {
    expect(cuesToSrt([{ startMs: 1500, endMs: 2500, text: 'Hi' }])).toBe('1\n00:00:01,500 --> 00:00:02,500\nHi\n');
  });
  it('round-trips through @remotion/captions parseVtt', async () => {
    const cues = groupCues(captionsFromText('Alpha beta. Gamma delta.', 4000));
    const parsed = await parseVttToCaptions(cuesToVtt(cues));
    expect(parsed.map((c) => c.text)).toEqual(['Alpha beta.', 'Gamma delta.']);
    expect(parsed[0].startMs).toBe(cues[0].startMs);
    expect(parsed[1].endMs).toBe(cues[1].endMs);
  });
});
