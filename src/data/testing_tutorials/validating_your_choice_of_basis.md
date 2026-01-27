This recipe will give you a few examples of how to verify that your choice of basis is appropriate for your data.

## What this will do
- Explain how to evaluate if your choice of basis is appropriate for your data
- Show how to use assertions to validate your choice of basis in your test suite

## Why would I want to do this?
- The basis used is a key part of how well a model fits your data. Using an inappropriate basis can lead to poor fits, overfitting, or underfitting.
- By validating your choice of basis, you can ensure that your model accurately captures the underlying patterns

## Pre-requisites
- Basic understanding of curve fitting concepts (See (/tutorials#getting_started))
- Choose a basis (See (/tutorials#basis-selection))

-----

# Evaluating with basis_select!

The [[basis_select!]] macro is a powerful tool to help you evaluate different basis functions for your data. 
It fits every supported basis to your data and provides a summary of the results, allowing you to compare their performance.

Let's run it on some sample data:

```rust
use polyfit::{basis_select, score::Aic, statistics::DegreeBound};

let data = vec![/* your (x, y) data here */];
basis_select!(data, DegreeBound::Relaxed, &Aic);
```

The output will be split into 2 sections: a summary table, and detailed results for each basis.

## Interpreting the results - Summary Table

Let's look at the summary table first. It provides a quick overview of how each basis performed:

```
# |             Basis              | Params | Score Weight | Fit Quality | Normality | Rating
--|--------------------------------|--------|--------------|-------------|-----------|-----------
1 |                        Fourier |      9 |      100.00% |      99.00% |    67.80% | 71% ☆☆★★★
2 |                       Laguerre |     11 |        0.00% |      69.86% |     0.00% | 33% ☆☆☆☆☆
3 |                       Legendre |     11 |        0.00% |      70.91% |     0.00% | 34% ☆☆☆☆☆
--|--------------------------------|--------|--------------|-------------|-----------|-----------
4 |                      Chebyshev |     11 |        0.00% |      70.91% |     0.00% | 34% ☆☆☆☆☆
5 |                    Logarithmic |     11 |        0.00% |      68.17% |     0.00% | 33% ☆☆☆☆☆
6 |          Probabilists' Hermite |      7 |        0.00% |      66.04% |     0.00% | 50% ☆☆☆☆★
7 |            Physicists' Hermite |     10 |        0.00% |      68.88% |     0.00% | 36% ☆☆☆☆☆

[ How to interpret the results ]
[ Results may be misleading for small datasets (<100 points) ]
 - Score Weight: Relative likelihood of being the best model among the options tested, based on the scoring method used.
 - Fit Quality: Proportion of variance in the data explained by the model (uses huber loss weighted r2).
 - Normality: How closely the residuals follow a normal distribution (useless for small datasets).
 - Rating: Combined score (0.75 * Fit Quality + 0.25 * Normality) to give an overall quality measure.
 - Stars: A simple star rating out of 5 based on the Rating score. Not scientific.
 - The best 3 models are shown below with their equations and plots (if enabled).
```

It looks overwhelming at first, but let's break down the key metrics, and what they mean for choosing a basis.

### Params

This is the number of parameters (coefficients) in the fitted model. The less parameters were needed to explain the data, the simpler the model is, and the less risk of overfitting.

We can see that the Hermites and Fourier are doing well here, needing only 7-10, but Fourier is near the top, and leading in every other metric.

### Score Weight

When we use the chosen scoring method (AIC in this case), the scores can give us the relative likelihood of each model being the best among the options tested. A higher score weight indicates a better fit relative to the other bases.

In this case Fourier has the advantage by a wide margin - it fits the data much better and has a lower parameter count than the other bases (which is taken into account by AIC).

This metric is how I sorted the table - the higher the score weight, the better. You can see that Aic is very confident that Fourier is the best choice here.

### Fit Quality

This is where I depart from statistical convention for the sake of readability to non-statisticians. Fit Quality is in fact the zero to one [R²](testing#r-squared---does-the-model-explain-the-data) score, expressed as a percentage for easier consumption.

I take the standard R², and the robust version that uses Huber loss to reduce the impact of outliers, and give the larger of the two as the Fit Quality score, expressed as a percentage.

A higher Fit Quality indicates that the model explains a larger proportion of the variance in the data.

If one basis has a significantly higher Fit Quality than the others, with a lower parameter count, it's almost certainly the better choice.

### Normality

This one is just the [residual normality](testing#normality-of-residuals---theres-error-but-is-it-random) p-value expressed as a percentage for readability.

This is basically the likelihood that the residuals (errors) from the fit are random errors, and not some underlying pattern that the model is missing. A higher value indicates that the residuals are more likely to be normally distributed, which is a good sign.

Even a value as low as 5% is fairly good evidence that the residuals are random, so don't be too concerned if this value is low - especially for small datasets where this test is not very reliable.

The 67% number for Fourier here is the superest of dupers.

### Rating

I will admit this one is basically made up for the sake of giving a single number to summarize the fit quality. It's a weighted combination of Fit Quality (75%) and Normality (25%), with a slight penalty for complexity, to give an overall quality measure.

It's basically just a weighted heuristic to match how I look at the table in practice.

The stars are just a simple visual representation of the Rating score, out of 5 stars, with 0-30% being 0 stars, Not scientific, but looks kinda neat

### Choosing the best basis

From the table, we can see that the Fourier basis is clearly the best choice for this dataset. It has the highest Score Weight, Fit Quality, and a good Normality score, all while using a relatively low number of parameters.

In practice, a lot of types of data will be a tie between multiple bases. I VERY HIGHLY recommend running this several times with new data sets to see if the same basis keeps coming out on top. If it does, you can be fairly confident in your choice.

## Interpreting the results - Detailed Basis Results

So let's take a look at the two stand-out bases from the summary table - Fourier and Probabilists' Hermite.

### Probabilists' Hermite Detailed Results

```
Probabilists' Hermite: y(x) = 1.55e-7·He₆(x) - 4.69e-5·He₅(x) + 0.01·He₄(x) - 0.31·He₃(x) + 8.46·He₂(x) - 103.73·He₁(x) + 384.74
Fit R²: 0.3708, Residuals Normality p-value: 0.0000
Wrote plot to target\plot_output\probabilists__hermite_examples_simple_fit.rs_line_19.png
```

![Probabilists' Hermite Fit Plot](/images/tutorials/testing_basis/probabilists__hermite.png)

Oh ok - so that explains the low Fit Quality and Normality scores. It clearly is missing the mark, and is too simple to capture the data's behavior. This probably means the even DegreeBound::Relaxed didn't go high enough in degree to capture the data's complexity. This one is out.

### Fourier Detailed Results

```
Fourier: xₛ = T[ 0..100 -> 0..2π ], y(x) = 128.64·cos(4xₛ) + 63.84·sin(4xₛ) + 32.31·cos(3xₛ) + 16.39·sin(3xₛ) + 7.65·cos(2xₛ) + 4.16·sin(2xₛ) + 0.94·cos(xₛ) + 0.14·sin(xₛ) + 0.06
Fit R²: 0.9900, Residuals Normality p-value: 0.6780
Wrote plot to target\plot_output\fourier_examples_simple_fit.rs_line_19.png
```

![Fourier Fit Plot](/images/tutorials/testing_basis/fourier.png)

Nice! The Fourier basis fits the data extremely well, with a very high R² value and a good Normality score. The plot shows that the model captures the underlying pattern in the data effectively.

# Evaluating visually with residuals

Let's also take a look at the residuals plot for the Fourier fit:

```
use polyfit::{FourierFit, score::Aic, statistics::DegreeBound, plot_residuals};

let data = vec![/* your (x, y) data here */];
let fit = FourierFit::fit(&data, DegreeBound::Relaxed, &Aic).unwrap();

plot_residuals!(fit);
```

![Fourier Residuals Plot](/images/tutorials/testing_basis/fourier_residuals.png)

## What to look for

From the plot we can see the following:

- The residuals are very small relative to the overall data range
- The blue trendline is pretty flat, so there no big structural patterns left in the residuals
- The residuals appear to be randomly scattered around zero, not clustered or all on one side
- The p-value from the normality test is quite high (0.81, or 81%), indicating the residuals are likely normally distributed

All of these are good signs that the Fourier basis is a good fit for the data.

## Counter example

Let's also look at the same plot for chebyshev basis, which did not perform as well:

![Chebyshev Residuals Plot](/images/tutorials/testing_basis/cheb_residuals.png)

From this plot we can see:

- The residuals are very large - approaching the same magnitude as the data itself
- The blue trend might be flat, but the trend is clear - the up and down sinusoidal pattern in the red residuals indicates the model is missing some underlying periodic behavior in the data.
- The residuals are not randomly scattered - they show a clear pattern
- The p-value from the normality test is 0, indicating the residuals are almost certainly not normally distributed

All of these indicate that the Chebyshev basis is not a good fit for this data.

# Evaluating by with cross validation

Cross validation is another powerful technique to evaluate the performance of different basis functions. It involves splitting your dataset into multiple subsets, training the model on some subsets, and testing it on the remaining ones. This helps to assess how well the model generalizes to unseen data.

We can use the same idea to get a robust estimate of some performance metrics as well! Here we will check the RMSE (Root Mean Square Error) across multiple folds.

The RMSE tells us how far off our model's predictions are from the actual data points, on average. A lower RMSE indicates a better fit.

Using folding, we can check how much this varies as the data changes, giving us a better idea of how well the basis performs overall!

We will use [[CurveFit::folded_rmse]] to do this, using [[statistics::CvStrategy]]

```rust
use polyfit::{FourierFit, score::Aic, statistics::DegreeBound, plot_residuals, statistics::{Confidence, CvStrategy}};

let data = vec![/* your (x, y) data here */];
let fit = FourierFit::fit(&data, DegreeBound::Relaxed, &Aic).unwrap();

// There are several strategies available - here we use MinimizeBias to prefer average performance over best-case performance
let uncertain_value = fit.folded_rmse(CvStrategy::MinimizeBias);

println!("Folded RMSE: {}", uncertain_value.confidence_band(Confidence::P95));
```

This gives us range of values that we are 95% confident contains the RMSE for any given dataset drawn from the same distribution:

```
Folded RMSE: 10.386621932448607 (10.265449331695509, 10.507794533201706) [confidence = 95%]
```

This tells us that the RMSE is likely around 10.39, with a 95% confidence interval from 10.27 to 10.51.

Since we can see that the values for the data go up to ~200, this is ~5% error, which is quite good, and the narrow confidence interval indicates that the basis performs consistently across different data splits!

# Conclusion

By using [[basis_select!]], visual residual analysis, and cross validation, we can effectively evaluate and validate our choice of basis function for curve fitting:

1. Run [[basis_select!]] multiple times on new datasets to see if the same basis consistently performs best.
2. Analyze the table metrics to choose the basis with the best combination of Score Weight, Fit Quality, and Normality.
3. Visually inspect the plots of the fits returned to ensure the model captures the data well.
4. Visually inspect the residuals plots to ensure the errors are small and randomly distributed.
5. Use cross validation to get robust estimates of performance metrics like RMSE.