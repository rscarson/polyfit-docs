This recipe will go over how to use Polyfit to test the quality of your curve fits using assertions in your test suite, and understand the metrics behind those assertions.

## What this will do
- Explain key fit quality metrics to consider
- Demonstrate how those metrics affect the final product
- Show how to write assertions to test them in your CI pipeline

## Why would I want to do this?
- Without a very deep understanding of statistics, it is very difficult to test if a fit is "good enough"
- Curve fitting should not be treated as a black box, and must be validated
- Polyfit includes built-in test tools for this purpose

-----

# R-Squared - Does the model explain the data?

R-Squared (R²) is a statistical measure that represents the proportion of the [variance](glossary#variance) of the data that is explained by the fitted model. It provides insight into how well the model captures the underlying patterns in the data.

It ranges from 0 (the model does not explain any of the variance) to 1 (the model perfectly explains all the variance). 

However, a high R² does not necessarily mean the model is the best fit, since you can always increase R² by adding more parameters to the model, which can lead to overfitting.

In general, if a model is not overfitted, an R² value above 0.7 is considered acceptable for many applications, and values above 0.9 are considered excellent. However, the acceptable threshold can vary depending on the specific context and requirements of the analysis.

There are currently three variants of R² implemented in Polyfit.

> ## Standard R² 
> This is what is usually meant by r squared, and its the metric you should provide if someone asks for "R²".
> 
> ### When to use it
> - When you have a clean dataset with minimal noise or outliers
> - When you want a simple and widely understood metric for fit quality
> 
> ### When to avoid it
> - When your dataset contains significant outliers that could skew the results
> - When comparing models with different numbers of parameters, as it does not account for model complexity
> 
> ### How to use it
> - [[statistics::r_squared]] for calculating R² on arbitrary data
> - [[CurveFit::r_squared]] for calculating R² on a fitted model
> - [[assert_r_squared]] for asserting minimum R² in tests

> ## Adjusted R²
> 
> This is a modified version of R² that adjusts for degree of a model to penalize the addition of unnecessary parameters.
> 
> ### When to use it
> - When comparing models with different numbers of parameters
> - When you want to account for overfitting in your fit quality assessment
> 
> ### When to avoid it
> - When you have a very small dataset, as the adjustment may not be reliable
> - When you want a simple metric and are not concerned about model complexity
> 
> ### How to use it
> - [[statistics::adjusted_r_squared]] for calculating adjusted R² on arbitrary data
> - [[CurveFit::adjusted_r_squared]] for calculating adjusted R² on a fitted model
> - [[assert_adjusted_r_squared]] for asserting minimum adjusted R² in tests

> ## Robust R²
> 
> This is a version of R² that is less sensitive to outliers by using a more robust measure called [Huber loss](glossary#huber-loss) to calculate the residuals.
>
> It is not the statistic definition of R², but for practical engineering purposes, it gives a better idea of how well the model explains the bulk of your data, without extreme values skewing the result.
>
> ### When to use it
> - When your dataset contains significant outliers that could skew the results
> - When you want a more reliable measure of fit quality in the presence of noise
>
> ### When to avoid it
> - When you have a clean dataset with minimal noise or outliers
> - When you want a simple and widely understood metric for fit quality
>
> ### How to use it
> - [[statistics::robust_r_squared]] for calculating robust R² on arbitrary data
> - [[CurveFit::robust_r_squared]] for calculating robust R² on a fitted model
> - [[assert_robust_r_squared]] for asserting minimum robust R² in tests

## Example A - Asserting R² in tests

In this example, we will fit a noisy dataset, and then assert that the fit quality meets a minimum R² threshold.

```rust
#[test]
fn test_fits() {
    let fit: CurveFit = my_fitting_function_under_test();
    assert_robust_r_squared!(fit, 0.9); // I am worried about outliers in my data, so I want to use robust R²
}
```

In this case, we want to verify that `my_fitting_function_under_test` produces a fit which, allowing for outliers, explains at least 90% of the variance in the data.

Should the test fail, Polyfit will generate a plot showing the data, the fit, and the residuals to help diagnose the issue:

![Failure plot, data in red, fit in blue](/images/recipes/using_asserts/assert_failed.png)

From the plot we can see the equation of the fit at the bottom right, and the data in red overlaid with the fit in blue. 

It is clear from the plot that the general shape of the curve *does* match the data, but there is enough noise that the R² is below our threshold of 0.9.

To fix this, we could either try a higher degree polynomial, or we could try to clean up the data before fitting, or use a different measure of success.

# Normality of Residuals - There's error, but is it random?

This brings us nicely to our next key metric for fit quality - the normality of residuals.

A residual is the difference between the observed value and the value predicted by the model. 

If the fit behaves well, and the errors are truly random and normally distributed, then the residuals should follow a normal distribution (bell curve) centered around zero.

There are types of data for which this is not the case - some types of noise are not normally distributed, and in those cases, this test may not be appropriate. Normal distributions are a common assumption in statistics, and many statistical tests rely on this assumption.

Random noise is usally normally distributed if it arises from many small, independent sources of error, like measurement inaccuracies, environmental factors, interference, etc.

We can check this - and it will tell us if there is some underlying pattern in the data that the model is not capturing.

## Ok but how does that work

I take two measurements about the residuals using [[statistics::skewness_and_kurtosis]]: 
- Skewness, which measures the symmetry of the distribution of residuals (are they evenly distributed around zero?)
- Kurtosis, which measures the "tailedness" of the distribution (are there more extreme values than expected in a normal distribution?)

Those are used in a [D'Agostino's K-squared test](https://en.wikipedia.org/wiki/D%27Agostino%27s_K-squared_test) to produce a p-value.
The easiest way to picture p-values is that they represent how likely it is that the observed data would occur if there were no underlying pattern causing the residuals.

A p-value is between 0 and 1, and above 0.05 is generally considered acceptable, indicating that the residuals are likely normally distributed.

Note - this works better the more data points you have - with very small datasets, the test may not be reliable.

## You lost me - why do I care

We can use [[statistics::residual_normality]] or [[assert_residuals_normal]] to get a p-value.
- If the p-value is high (above 0.05), it suggests that the errors in the fit are random and the fit is likely appropriate for the data.
- If the p-value is low (below 0.05), it indicates that the residuals have a non-random cause, and you probably need a different basis or a higher degree polynomial.

## Example B - Asserting normality of residuals in tests

In this example, we will fit a dataset, and then assert that the residuals are normally distributed.

For this sample, let's say we are using [[CurveFit::new_auto]] with the [Monomial](glossary#monomial-basis) basis to fit the data, which gives us a polynomial fit of automatically determined degree.

```rust
#[test]
fn test_fits() {
    let fit: CurveFit = my_fitting_function_under_test();
    assert_residuals_normal!(fit, 0.05); // I want to ensure the residuals are normally distributed at the 5% significance level
}
```

In this case, now that we know R² is not a good enough measure of fit quality on its own, we want to verify that `my_fitting_function_under_test` actually explains the data well, and that the errors are random, not systematic.

If the test fails, Polyfit will again generate a plot showing the data, the fit, and the residuals to help diagnose the issue:

![Failure plot, 95% range for residuals in green/pink, residuals in red, fit over residuals in blue](/images/recipes/using_asserts/assert_failed2.png)

Now - I must admit, normally statisticians use a [Q-Q plot](https://en.wikipedia.org/wiki/Q%E2%80%93Q_plot) to visualize normality of residuals, but they have a learning curve. So polyfit just shows you the residuals overlaid with error bars representing a normal distribution.

The residuals are what's left over if you subtract the point the fit predicts, and the shape in this form can often hint at what pattern is being missed by the fit.

The residuals here clearly do not follow a normal distribution - there's a very obvious pattern to them - the wavy sinusoidal shape indicates that the Monomial basis is not capturing some underlying periodic behavior in the data! We should be using a different basis, such as [Fourier](glossary#fourier-basis), or [Chebyshev](glossary#chebyshev-basis)!

# Residual Magnitude - Are the errors small enough?

Finally, we can also check the magnitude of the residuals themselves.

`assert_max_residual!` allows us to assert that a certain proportion of the residuals are below a certain threshold, which is useful when you have specific noise tolerances in your application.

## Example C - Asserting maximum residual magnitude in tests

Let's say we have a large dataset representing measurements in a manufacturing process, and we want to ensure that our fit is accurate within a specified tolerance in mm.

Let's generate a dataset for this example:

```rust
use polyfit::{
    ChebyshevFit, basis::FourierBasis, score::Aic, statistics::{Confidence, DegreeBound}, transforms::{ApplyNoise, Strength}
};

// Big ugly dataset with periodic noise
let wigglyboi = FourierBasis::new_polynomial((0.0, 100.0), &[0.5, 1.0, 2.0, 4.0, 8.0, 16.0, 32.0, 64.0, 128.0])?;

// Get ~1000 data points with relative noise of ~10%
let data = wigglyboi.solve_range(0.0..=100.0, 0.1).apply_normal_noise(Strength::Relative(0.1), None);
```

This is a low noise, high frequency periodic dataset. Because we can assume it is predictable, and we have domain-specific knowledge that our measurements should be accurate within 50mm, we can use `assert_max_residual!` to verify that at least 95% of the residuals are below that threshold. (yes I know that's a lot of mm, just go with it).

```rust
#[test]
fn test_fits() {
    let fit = polyfit::FourierFit::new_auto(
        &data,
        DegreeBound::Conservative,
        &Aic,
    )?;
    assert_max_residual!(fit, 50.0); // I want to ensure that at least 95% (the default) of residuals are below 50mm
}
```

Seems the test failed - let's look at the plot Polyfit generated to diagnose the issue:

![Failure plot, curve fit in blue, data in red](/images/recipes/using_asserts/assert_failed3.png)

Ah that's fairly clear - the fit is not capturing the high frequency oscillations in the data, leading to large residuals. Basically, we need to increase the degree of the Fourier basis to capture those oscillations better.

Instead of conservative degree selection, let's try relaxed - it will test a wider range of degrees:

```rust
#[test]
fn test_fits() {
    let fit = polyfit::FourierFit::new_auto(
        &data,
        DegreeBound::Relaxed,
        &Aic,
    )?;
    assert_max_residual!(fit, 50.0);
    plot!(fit);
}
```

![Success plot, curve fit in blue, data in red](/images/recipes/using_asserts/passed3.png)

Much better - the fit now captures the oscillations in the data, and the residuals are within our acceptable range.