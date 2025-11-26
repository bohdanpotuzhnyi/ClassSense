import csv
import json
import math
import os
from pathlib import Path
from statistics import NormalDist
from typing import List, Tuple

# Ensure matplotlib can cache in a writable location and use a non-GUI backend.
os.environ.setdefault("MPLCONFIGDIR", str(Path(__file__).parent / ".mpl_cache"))
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt


RESULTS_DIR = Path(__file__).parent / "results"
SLIDERS_CSV = RESULTS_DIR / "sliders.csv"
BUTTONS_CSV = RESULTS_DIR / "buttons.csv"
TTEST_TXT = RESULTS_DIR / "t_test_buttons_vs_sliders.txt"
CHART_BUTTONS = RESULTS_DIR / "button_time_by_pace.png"
CHART_SLIDERS = RESULTS_DIR / "slider_time_by_focus_bucket.png"


def collect_events(results_dir: Path):
    """Read JSON files and split slider vs button events while deduplicating by received_at."""
    slider_rows = []
    button_rows = []
    seen_sliders = set()
    seen_buttons = set()

    for json_path in sorted(results_dir.glob("*.json")):
        with open(json_path, "r", encoding="utf-8") as handle:
            data = json.load(handle)

        for event in data.get("emotions", []):
            timestamp = event.get("received_at")
            payload = event.get("payload", {}) or {}

            if "slider_time_ms" in payload and "focus" in payload:
                if timestamp and timestamp not in seen_sliders:
                    seen_sliders.add(timestamp)
                    slider_rows.append(
                        {
                            "timestamp": timestamp,
                            "input_time_ms": payload.get("slider_time_ms"),
                            "value": payload.get("focus"),
                        }
                    )
            elif "buttons_time_ms" in payload and "pace" in payload:
                if timestamp and timestamp not in seen_buttons:
                    seen_buttons.add(timestamp)
                    button_rows.append(
                        {
                            "timestamp": timestamp,
                            "input_time_ms": payload.get("buttons_time_ms"),
                            "value": payload.get("pace"),
                        }
                    )

    slider_rows.sort(key=lambda row: row["timestamp"])
    button_rows.sort(key=lambda row: row["timestamp"])
    return slider_rows, button_rows


def write_csv(path: Path, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["timestamp", "input_time_ms", "value"])
        writer.writeheader()
        writer.writerows(rows)


def welch_ttest(sample_a, sample_b, alternative="less"):
    """Return Welch's t statistic, df, and p-value (approx normal CDF fallback)."""
    n1, n2 = len(sample_a), len(sample_b)
    mean1 = sum(sample_a) / n1
    mean2 = sum(sample_b) / n2
    var1 = sum((x - mean1) ** 2 for x in sample_a) / (n1 - 1) if n1 > 1 else 0.0
    var2 = sum((x - mean2) ** 2 for x in sample_b) / (n2 - 1) if n2 > 1 else 0.0

    denom = math.sqrt(var1 / n1 + var2 / n2)
    if denom == 0:
        return 0.0, float("inf"), 1.0

    t_stat = (mean1 - mean2) / denom
    df_num = (var1 / n1 + var2 / n2) ** 2
    df_den = (var1**2) / (n1**2 * (n1 - 1)) + (var2**2) / (n2**2 * (n2 - 1))
    df = df_num / df_den if df_den else float("inf")

    norm = NormalDist()
    if alternative == "less":
        p_value = norm.cdf(t_stat)
    elif alternative == "greater":
        p_value = 1 - norm.cdf(t_stat)
    else:  # two-sided
        p_value = 2 * min(norm.cdf(t_stat), 1 - norm.cdf(t_stat))
    return t_stat, df, p_value, mean1, mean2, n1, n2


def mann_whitney_u(sample_a, sample_b):
    """Mann-Whitney U (two-sided) with normal approximation for p-value."""
    # rank all observations
    combined = [(x, "a") for x in sample_a] + [(x, "b") for x in sample_b]
    combined.sort(key=lambda t: t[0])

    ranks = {}
    i = 0
    while i < len(combined):
        j = i
        while j < len(combined) and combined[j][0] == combined[i][0]:
            j += 1
        avg_rank = (i + j + 1) / 2.0
        for k in range(i, j):
            ranks.setdefault(k, avg_rank)
        i = j

    rank_a = sum(ranks[idx] for idx, (_, grp) in enumerate(combined) if grp == "a")
    n1, n2 = len(sample_a), len(sample_b)
    u1 = rank_a - n1 * (n1 + 1) / 2
    u2 = n1 * n2 - u1
    u = min(u1, u2)

    mean_u = n1 * n2 / 2
    std_u = math.sqrt(n1 * n2 * (n1 + n2 + 1) / 12)
    z = (u - mean_u) / std_u if std_u else 0.0

    norm = NormalDist()
    p_value = 2 * min(norm.cdf(z), 1 - norm.cdf(z))
    return u1, u2, z, p_value


def effect_sizes(button_times, slider_times):
    """Return Cohen's d and mean difference."""
    n1, n2 = len(button_times), len(slider_times)
    mean1 = sum(button_times) / n1
    mean2 = sum(slider_times) / n2
    diff = mean1 - mean2

    var1 = sum((x - mean1) ** 2 for x in button_times) / (n1 - 1) if n1 > 1 else 0.0
    var2 = sum((x - mean2) ** 2 for x in slider_times) / (n2 - 1) if n2 > 1 else 0.0
    pooled = math.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2)) if n1 + n2 > 2 else 0.0
    d = diff / pooled if pooled else 0.0
    return diff, d


def bootstrap_mean_diff(a, b, iters=5000, seed=42):
    """Bootstrap CI for mean difference a-b."""
    import random

    random.seed(seed)
    diffs = []
    for _ in range(iters):
        samp_a = [random.choice(a) for _ in a]
        samp_b = [random.choice(b) for _ in b]
        diffs.append(sum(samp_a) / len(samp_a) - sum(samp_b) / len(samp_b))
    diffs.sort()
    lo_idx = int(0.025 * iters)
    hi_idx = int(0.975 * iters)
    return diffs[lo_idx], diffs[hi_idx]


def write_ttest_report(button_rows, slider_rows):
    button_times = [float(r["input_time_ms"]) for r in button_rows if r.get("input_time_ms") is not None]
    slider_times = [float(r["input_time_ms"]) for r in slider_rows if r.get("input_time_ms") is not None]
    if not button_times or not slider_times:
        content = "Not enough data to run t-test.\n"
    else:
        t_stat, df, p_value, mean_b, mean_s, n_b, n_s = welch_ttest(button_times, slider_times, alternative="less")
        u1, u2, z, p_mw = mann_whitney_u(button_times, slider_times)
        diff, d = effect_sizes(button_times, slider_times)
        try:
            ci_low, ci_high = bootstrap_mean_diff(button_times, slider_times)
        except Exception:
            ci_low = ci_high = None

        content_lines = [
            "Button vs Slider input time tests",
            f"button_n={n_b}, slider_n={n_s}",
            f"button_mean_ms={mean_b:.3f}, slider_mean_ms={mean_s:.3f}",
            "",
            "Welch t-test (H1: button < slider)",
            f"t_stat={t_stat:.6f}, df={df:.2f}, p_value={p_value:.6g} (normal approximation)",
            "",
            "Mann-Whitney U (two-sided)",
            f"u1={u1:.1f}, u2={u2:.1f}, z={z:.6f}, p_value={p_mw:.6g}",
            "",
            "Effect sizes",
            f"mean_diff_ms (button-slider)={diff:.3f}",
            f"Cohen_d={d:.3f}",
        ]
        if ci_low is not None:
            content_lines.append(f"bootstrap_mean_diff_95pct_CI=[{ci_low:.3f}, {ci_high:.3f}]")
        content = "\n".join(content_lines) + "\n"

    TTEST_TXT.write_text(content, encoding="utf-8")


def histogram_counts(times: List[float], bins: List[Tuple[int, int]]):
    counts = [0] * len(bins)
    for t in times:
        for idx, (lo, hi) in enumerate(bins):
            if lo <= t < hi:
                counts[idx] += 1
                break
    return counts


def plot_button_time_by_pace(button_rows):
    """Boxplot: x=paces, y=time (ms)."""
    pace_times = {}
    for row in button_rows:
        t = row.get("input_time_ms")
        pace = row.get("value")
        if t is None or pace is None:
            continue
        pace_times.setdefault(str(pace), []).append(float(t))

    if not pace_times:
        return

    labels = sorted(pace_times.keys())
    data = [pace_times[label] for label in labels]

    fig, ax = plt.subplots(figsize=(8, 4))
    ax.boxplot(data, labels=labels, showmeans=True)
    ax.set_xlabel("Button answer (pace)")
    ax.set_ylabel("Time (ms)")
    ax.set_title("Button input time by pace")
    plt.tight_layout()
    plt.savefig(CHART_BUTTONS, dpi=150)
    plt.close(fig)


def plot_slider_time_by_focus_bucket(slider_rows):
    """Boxplot: x=focus bucket (0-25, 25-50, 50-75, 75-100), y=time."""
    buckets = {
        "0-25": [],
        "25-50": [],
        "50-75": [],
        "75-100": [],
    }
    for row in slider_rows:
        t = row.get("input_time_ms")
        focus = row.get("value")
        if t is None or focus is None:
            continue
        try:
            focus_val = float(focus)
        except (TypeError, ValueError):
            continue

        if 0 <= focus_val < 25:
            buckets["0-25"].append(float(t))
        elif 25 <= focus_val < 50:
            buckets["25-50"].append(float(t))
        elif 50 <= focus_val < 75:
            buckets["50-75"].append(float(t))
        elif 75 <= focus_val <= 100:
            buckets["75-100"].append(float(t))

    labels = [label for label in ["0-25", "25-50", "50-75", "75-100"] if buckets[label]]
    if not labels:
        return
    data = [buckets[label] for label in labels]

    fig, ax = plt.subplots(figsize=(8, 4))
    ax.boxplot(data, labels=labels, showmeans=True)
    ax.set_xlabel("Slider answer bucket (focus %)")
    ax.set_ylabel("Time (ms)")
    ax.set_title("Slider input time by focus bucket")
    plt.tight_layout()
    plt.savefig(CHART_SLIDERS, dpi=150)
    plt.close(fig)


def main():
    sliders, buttons = collect_events(RESULTS_DIR)
    write_csv(SLIDERS_CSV, sliders)
    write_csv(BUTTONS_CSV, buttons)
    write_ttest_report(buttons, sliders)
    if buttons:
        plot_button_time_by_pace(buttons)
    if sliders:
        plot_slider_time_by_focus_bucket(sliders)


if __name__ == "__main__":
    main()
