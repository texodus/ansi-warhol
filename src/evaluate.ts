function kurtosis(xs: number[]): number {
    const n = xs.length;
    const mean = xs.reduce((a, b) => a + b, 0) / n;
    const m2 = xs.reduce((a, x) => a + (x - mean) ** 2, 0) / n;
    const m4 = xs.reduce((a, x) => a + (x - mean) ** 4, 0) / n;
    if (m2 === 0) return 0;
    return 0 - (m4 / (m2 * m2) - 3);
}

function chiSquaredGoF(xs: number[]): number {
    const n = xs.length;
    const counts = new Map<number, number>();
    for (let i = 0; i < n; i++) {
        counts.set(xs[i], (counts.get(xs[i]) || 0) + 1);
    }
    const k = counts.size;
    const expected = n / k;
    let chi2 = 0;
    for (const observed of counts.values()) {
        const d = observed - expected;
        chi2 += (d * d) / expected;
    }

    return chi2;
}

export const EVALUTATE_FNS = {
    "KURTOSIS": kurtosis,
    "CHISQUARED": chiSquaredGoF
}
