import type { VaxGuardResult } from '../lib/arrhenius';

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Summary Text ─────────────────────────────────────────────────────────────

export function generateVaxGuardSummary(
  result: VaxGuardResult,
  vaccineName: string,
  lang: 'en' | 'ko' | 'fr' | 'sw'
): string {
  const { mkt, potency, calculatedAt } = result;
  const date = new Date(calculatedAt).toLocaleString();

  if (lang === 'ko') {
    return [
      `[VaxGuard 백신 열화 판정 결과]`,
      `백신: ${vaccineName}`,
      `판정: ${potency.verdict}`,
      `MKT: ${mkt.mktC.toFixed(1)}°C`,
      `잔존 역가: ${potency.remainingPotency.toFixed(1)}%`,
      `역가 손실: ${potency.potencyLoss.toFixed(1)}%`,
      `총 노출 시간: ${mkt.totalHours.toFixed(1)}h`,
      `권고 조치: ${potency.recommendedAction}`,
      `판정 일시: ${date}`,
      ``,
      `-- VaxGuard (vaxguard.pages.dev) --`,
    ].join('\n');
  }

  if (lang === 'fr') {
    return [
      `[VaxGuard — Résultat d'évaluation vaccinale]`,
      `Vaccin: ${vaccineName}`,
      `Verdict: ${potency.verdict}`,
      `TCM: ${mkt.mktC.toFixed(1)}°C`,
      `Puissance résiduelle: ${potency.remainingPotency.toFixed(1)}%`,
      `Perte de puissance: ${potency.potencyLoss.toFixed(1)}%`,
      `Exposition totale: ${mkt.totalHours.toFixed(1)}h`,
      `Action recommandée: ${potency.recommendedAction}`,
      `Date: ${date}`,
      ``,
      `-- VaxGuard (vaxguard.pages.dev) --`,
    ].join('\n');
  }

  if (lang === 'sw') {
    return [
      `[VaxGuard — Matokeo ya Tathmini ya Chanjo]`,
      `Chanjo: ${vaccineName}`,
      `Uamuzi: ${potency.verdict}`,
      `JWK: ${mkt.mktC.toFixed(1)}°C`,
      `Nguvu Iliyobaki: ${potency.remainingPotency.toFixed(1)}%`,
      `Upotezaji: ${potency.potencyLoss.toFixed(1)}%`,
      `Jumla ya Mfiduo: ${mkt.totalHours.toFixed(1)}h`,
      `Hatua: ${potency.recommendedAction}`,
      `Tarehe: ${date}`,
      ``,
      `-- VaxGuard (vaxguard.pages.dev) --`,
    ].join('\n');
  }

  // EN (default)
  return [
    `[VaxGuard — Vaccine Cold Chain Assessment]`,
    `Vaccine: ${vaccineName}`,
    `Verdict: ${potency.verdict}`,
    `MKT: ${mkt.mktC.toFixed(1)}°C`,
    `Remaining Potency: ${potency.remainingPotency.toFixed(1)}%`,
    `Potency Loss: ${potency.potencyLoss.toFixed(1)}%`,
    `Total Exposure: ${mkt.totalHours.toFixed(1)}h`,
    `Recommended Action: ${potency.recommendedAction}`,
    `Assessed: ${date}`,
    ``,
    `-- VaxGuard (vaxguard.pages.dev) --`,
  ].join('\n');
}

// ─── Share ────────────────────────────────────────────────────────────────────

export function shareViaWhatsApp(summary: string): void {
  const url = `https://wa.me/?text=${encodeURIComponent(summary)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function shareViaEmail(subject: string, body: string): void {
  const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
}

// ─── JSON Export ──────────────────────────────────────────────────────────────

export function exportResultToJSON(result: VaxGuardResult, vaccineName: string): void {
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
