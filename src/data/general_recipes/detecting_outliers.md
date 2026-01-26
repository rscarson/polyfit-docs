This recipe demonstrates how to identify outliers in a dataset using polyfit in a variety of ways.

## What this will do
- Explain confidence bands and how to use them
- Demonstrate the tolerance parameter I added here for engineering applications
- Finding outliers
- Plotting outliers

## Why would I want to do this?
- Given a data set, you can identify points that are significantly different from trend
- You can use this to clean data, identify errors, or find interesting anomalies

## How do I write tests for this?
- Remove only the outliers and verify the fit improves with [[CurveFit::r_squared]]
- Generate synthetic outliers with [Simulating noisy data for testing](/testing#simulating-noisy-data-for-testing)

-----

Given a set of data, one of the more common needs you might have is to identify outliers - points that are significantly different from the overall trend of the data.

This is a pretty common need in data analysis, as outliers can skew results, indicate errors in data collection, or highlight interesting anomalies. Personally I used outlier detection to flag weird readings to the user for review.

The method that polyfit provides for outlier detection is based on confidence bands - Effectively, you fit a curve to your data, then given how sure you are about the fit representing your data well, you can determine the range of values that are "normal" for that fit. Points that fall outside this range can be considered outliers.

The 2 tuning parameters I expose for this are:
- Confidence Level: This determines how sure you are about how well the fit represents your data.
    - A higher confidence level means a wider band, and fewer points will be considered outliers. Common values are 90%, 95%, and 99%.
- Tolerance: This is an engineering-focused parameter that allows you to specify a fixed tolerance band around the fit, in addition to the statistical confidence band. 
    - This is useful when you have domain knowledge about acceptable deviations.

# Confidence Bands

You may be wondering why you suddenly need to care about confidence bands, the good news is you kind of don't.

A confidence band is just a way to show that you are not 100% sure about how good the curve fit is.

So the less you trust the fit, the higher the level of confidence you want, and the wider the band will be.

In polyfit, confidence bands are provided by the `covariance` of a fit, see [[CurveFit::covariance]].

It provides the following method to compute confidence bands:
- [[CurveFitCovariance::coefficient_standard_errors]]: Calculates the standard errors of the fit coefficients
- [[CurveFitCovariance::confidence_band]]: Calculates the confidence band at a given x value
- [[CurveFitCovariance::prediction_variance]]: Calculates the prediction variance at a given x value
- [[CurveFitCovariance::solution_confidence]]: Calculates the overall confidence of the entire set of canonical x values for the fit
- [[CurveFitCovariance::outliers]]: Identifies outliers in the dataset based on the confidence bands and tolerance

A [[statistics::ConfidenceBand]] gives you the following information in addition to the confidence and tolerance you provided:
- `lower`: The lower bound of the confidence interval at a specific x value
- `upper`: The upper bound of the confidence interval at a specific x value
- `value`: The mean predicted value at that x value

Or, in other word, for a given value, the true value is expected to fall between `lower` and `upper` with the specified confidence percentage.


```rust
let fit = FourierFit::new_auto(data, DegreeBound::Relaxed, &Aic)?;
let covariance = fit.covariance()?;

let x = 2.0;
let band = covariance.confidence_band(x, Confidence::P95, None)?;
println!("At x = {x}, we are 95% confident the true value is between {} and {}", band.lower, band.upper);
```

# Tolerance? Didn't we just do that?

Ok yes - sort of. the tolerance also just messes with the width of the band, but hear me out

The confidence band is based on statistics - and frankly just doesn't map cleanly to my needs without a lot of math.

So I added a tolerance parameter that just expands the band by an amount, in one of 3 ways:

## Absolute Tolerance
This just expands the band by a fixed amount up and down.

For example maybe you have a manufacturing process that you know is only accurate to +/- 0.5 units, so you set the tolerance to 0.5:
`Tolerance::Absolute(0.5)`

This makes the band wider by 0.5 units on both sides.

## Variance Tolerance
This expands the band by a multiple of the variance of the data.

For example, in vibration analysis of rotating machinery, engineers may allow a tolerance of ±10% of the signal variance:
`Tolerance::Variance(0.1)`

This makes the band wider by 10% of the variance of the data on both sides.

**Note:** I also use this when I have created simulated data with a known noise level using [[transforms::NoiseTransform]] or [[transforms::ApplyNoise]]

## Measurement Tolerance
This expands the band by a percentage of the measured value at that point.

For example, in some sensor applications, a tolerance of ±5% of the measured value may be acceptable:
`Tolerance::Measurement(0.05)`

This makes each band wider by 5% of the measured value at that point on both sides.

# Finding Outliers

Once you have a fit and its covariance, you can find outliers using the `outliers` method on [[CurveFitCovariance]].

This snippet finds outliers at 95% confidence with an absolute tolerance of 0.5 units:

```rust
let fit = FourierFit::new_auto(data, DegreeBound::Relaxed, &Aic)?;
let covariance = fit.covariance()?;
let outliers = covariance.outliers(Confidence::P95, Some(Tolerance::Absolute(0.5)))?;

println!("We can be 95% confident that the following points are outliers, given a tolerance of ±0.5 units:");
for outlier in outliers {
    let (x, y, confidence_band) = outlier;
    println!("x={x}, y={confidence_band}");
}
```

We can even use a built in convenience function to plot the outliers along with the fit and confidence bands for visualization or debugging:

```rust
let points = PlottingElement::from_outliers(outliers.into_iter());
plot!([fit, points], {
    // Make sure the generated error bars match the outlier detection parameters
    Confidence::P95, Some(Tolerance::Absolute(0.5))
});
```