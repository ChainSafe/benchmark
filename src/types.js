"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AverageCalculationEnum = exports.ConvergenceEnum = void 0;
/** Algorithms to detect when to stop the benchmark runs */
exports.ConvergenceEnum = {
    /**
     * **Linear**:
     *
     * Uses a moving-average approach to check for convergence by comparing
     * how consecutive averages change over time. Concretely, the logic tracks
     * a few past average values (e.g. last 3 averages) and determines if:
     *
     * 1. The difference between the most recent average and the oldest
     *    average is sufficiently small (linear convergence).
     * 2. Additionally, it may check that the “midpoint” or intermediate average
     *    is consistent with the trend (quadratic element in the code).
     *
     * This approach works best in relatively stable environments or for
     * functions whose execution times fluctuate minimally. However, if there is
     * high noise or if runs are extremely fast (on the nanosecond scale),
     * you might see premature stopping or extended run times.
     */
    Linear: "linear",
    /**
     * **Coefficient of Variation (CV)**:
     *
     * This approach calculates the ratio of the sample standard deviation
     * to the mean (σ/μ) over all data points collected so far.
     * - If the CV falls below a specified threshold (convergeFactor),
     *   we consider that “stable” and stop.
     * - As a fallback, if too many runs occur without convergence,
     *   the code may compare mean vs. median to decide if it’s time to stop.
     *
     * Strengths:
     * - Good for benchmarks with moderate noise: it normalizes variation by
     *   the mean, so it handles scale differences well.
     * - Straightforward to implement and interpret (CV < x%).
     *
     * Limitations:
     * - Highly noisy benchmarks or micro benchmarks (few nanoseconds) can
     *   cause erratic CV values. If the noise is large relative to the mean,
     *   convergence may never be triggered. Conversely, extremely uniform runs
     *   can cause an instant (potentially premature) stop.
     */
    CV: "cv",
};
/** How to calculate average for output */
exports.AverageCalculationEnum = {
    /** Calculate simple average */
    Simple: "simple",
    /** Clean the outliers first then calculate the average */
    CleanOutliers: "clean-outliers",
};
