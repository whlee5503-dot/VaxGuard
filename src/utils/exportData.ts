import type { TFunction } from 'i18next';
import type { VaxGuardResult } from '../lib/arrhenius';
import type { VVMStage } from '../lib/vaccines';
import {
  LEGACY_VERDICT,
  type ShakeTestResult,
  type VerdictOutput,
} from '../lib/verdict';

/** Result as stored by Input.tsx (verdict fields are absent in older records). */
export interface SummarySource extends VaxGuardResult {
  vvmStage?: VVMStage | null;
  shakeTest?: ShakeTestResult;
  finalVerdict?: VerdictOutput;
  estimateAvailable?: boolean;
}

const SHAKE_KEY: Record<ShakeTestResult, string> = {
  passed: 'passed',
  failed: 'failed',
  not_done: 'notDone',
};

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Summary Text ─────────────────────────────────────────────────────────────

/**
 * Builds the share text from the same i18n keys as the Result screen,
 * so the message always matches what the user saw.
 */
export function generateVaxGuardSummary(
  result: SummarySource,
  vaccineName: string,
  t: TFunction
): string {
  const { mkt, potency, calculatedAt } = result;
  const final = result.finalVerdict ?? LEGACY_VERDICT;
  const date = new Date(calculatedAt).toLocaleString();
  const vvm = result.vvmStage
    ? t('vvm.stage' + result.vvmStage)
    : t('vvm.unknown');

  const lines: string[] = [
    `[VaxGuard — ${t('app.tagline')}]`,
    `${t('history.vaccine')}: ${vaccineName}`,
    `${t('history.verdict')}: ${t('result.verdict.' + final.verdict)}`,
  ];
  for (const r of final.reasons) lines.push(`- ${t('result.reasons.' + r)}`);
  for (const w of final.warnings) lines.push(`- ${t('result.warnings.' + w)}`);

  lines.push(`${t('input.vvmLabel')}: ${vvm}`);
  if (final.freezeExposure && result.shakeTest) {
    lines.push(
      `${t('input.shakeTest')}: ${t('input.shakeOptions.' + SHAKE_KEY[result.shakeTest])}`
    );
  }

  lines.push(
    `${t('result.action')}: ${t('result.actions.' + final.verdict)}`,
    '',
    `${t('result.mkt')}: ${mkt.mktC.toFixed(1)}°C`,
    `${t('result.totalExposure')}: ${mkt.totalHours.toFixed(1)} ${t('result.hours')}`,
    ...(result.estimateAvailable === false ? [] : [`${t('result.estimateTitle')}: ${potency.remainingPotency.toFixed(1)}%`]),
    `${t('history.date')}: ${date}`,
    '',
    '-- VaxGuard (vaxguard.phtlab.org) --',
    'PHT Lab · phtlab.org'
  );

  return lines.join('\n');
}

// ─── Share ────────────────────────────────────────────────────────────────────

export function shareViaWhatsApp(summary: string): void {
  const url = `https://wa.me/?text=${encodeURIComponent(summary)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

/**
 * Opens the OS share sheet when available (mobile, Chrome/Edge on Windows).
 * Otherwise copies the text to the clipboard. mailto: links are avoided
 * because they fail silently when no default mail app is set.
 */
export async function shareSummary(title: string, text: string): Promise<ShareOutcome> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text });
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
      // Otherwise fall through to the clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}

// ─── JSON Export ──────────────────────────────────────────────────────────────

export function exportResultToJSON(result: SummarySource, vaccineName: string): void {
  const data = { vaccineName, ...result };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vaxguard_${vaccineName}_${todayString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
