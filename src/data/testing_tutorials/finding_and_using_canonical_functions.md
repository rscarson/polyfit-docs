This recipe will show you how to find and use a function to generate data for your tests.

## What this will do
- Explore several options for finding a canonical function to represent your data
- Show how to define and use that function in your tests
- Give examples on ways to get more out of your test data

## Why would I want to do this?
- Needing access to live hardware or production data for testing is impractical, and usually a security risk
- Using static datasets for testing is difficult to maintain, and can lead to brittle tests
- Generating data from functions allows for more flexible and maintainable tests

## Prerequisites

Before continuing, please use [Basis Selection](/tutorials#basis-selection) to make sure you can find the best choice of basis for your data.

You should also have a variety of sample data sets to use, as well as an understanding of the kinds of edge-cases you want to test.

-----

# Finding Canonical Functions

There are many ways to get a canonical function for your use, the ones I will go over are:

1. Using your domain knowledge, or the documentation from your data source to pick a function
2. Fitting a noisy dataset to get a smooth function
3. Postprocessing a fitted function to filter out noise

<div class="alert alert-warning" role="alert">
    <i class="bi bi-exclamation-circle-fill me-2"></i>
    These functions are only approximations of your data, and may not capture all the nuances of the real data. Always validate your tests against real data, and use [transforms](/tutorials#simulating-noisy-data-for-testing) to randomize properties when possible.
</div>

# 1. Using Domain Knowledge to Pick a Function

In many cases your own knowledge about the data under test is sufficient, and the function used to estimate results is well understood.

## Based on a known constant

For example, you might be working with a transmitter where you know the attenuated signal strength in your setup is a specific constant:
```
use polyfit::function;
function!(y(x) = 10);
```
You can then use [[transforms::NoiseTransform]] to add noise to this function to simulate real-world data (See [Simulating Noisy Data for Testing](testing#simulating-noisy-data-for-testing)).

## Based on known behavior

Or you might have a temperature sensor where you know the temperature varies sinusoidally over the course of a day:

```rust
use polyfit::basis::FourierBasis;
let function = FourierBasis::new_polynomial((0.0, 24.0), &[0.0, 20.0, 5.0])?;
// This is the equivalent of:
// xₛ = T[ 0..24 -> 0..2π ], y(x) = 5.00·cos(xₛ) + 20.00·sin(xₛ)
// I don't have a cool macro for this yet :(
```

## Based on documentation

In many cases, an estimation of the average or expected behavior of your data source may be documented, or known. For example in epidemiology, there are well known exponential growth and decay models that can be used to approximate disease spread.

Or if you are modelling the behaviour of a specific product or system, the manufacturer may provide performance curves or other data that can be used to derive a canonical function.

# 2. Fitting Noisy Data to Get a Smooth Function

If you only have access to noisy data, you can use Polyfit to fit a smooth function using a technique called pooling.

The concept is very simple; you concatenate several noisy datasets together, and then fit a function to the combined data. This averages out the noise, without erasing the underlying trends or important outliers.

For example, if you have three datasets:
```rust
let data1 = vec![(0.0, 1.1), (1.0, 2.0), (2.0, 3.2)];
let data2 = vec![(0.0, 0.9), (1.0, 2.1), (2.0, 2.8)];
let data3 = vec![(0.0, 1.0), (1.0, 1.9), (2.0, 3.0)];
```

You can pool them together and fit over that:

**Note:** We use `as_monomial()` here to convert the fit to a Monomial function for easier use later, but you can keep it in the original basis if desired. Just make sure to get the domain with [[CurveFit::x_range]] and coefficients with [[CurveFit::coefficients]] to pass to a function like [[basis::ChebyshevBasis::new_polynomial]] or [[basis::FourierBasis::new_polynomial]] as needed.

```rust
use polyfit::{ChebyshevFit, score::Aic, statistics::DegreeBound};

let pooled_data: Vec<(f64, f64)> = data1.into_iter()
    .chain(data2)
    .chain(data3)
    .collect();

let fit = ChebyshevFit::new_auto(&pooled_data, DegreeBound::Relaxed, &Aic)?;
let func = fit.as_monomial()?;
println!("Canonical function: {func}");
```

And, if for example the result was `5.51x² - 19.59x + 508.78`, you could then define your canonical function as:

```rust
use polyfit::function;
function!(y(x) = 5.51 x^2 - 19.59 x + 508.78);

// And to get data from it:
let data = y.solve_range(0.0..=10.0, 0.1); 
```

# 3. Postprocessing Method: Function Filtering

If you are using an [orthogonal basis](glossary#orthogonal) - basically any but Monomial or Logarithmic - you can use an advanced filtering technique called spectral energy filtering to smooth the resulting function after fitting.

For example, if you have a noisy dataset and fit a Chebyshev basis to it:

```rust
use polyfit::{ChebyshevFit, score::Aic, statistics::DegreeBound};

let mut fit = ChebyshevFit::new_auto(&noisy_data, DegreeBound::Relaxed, &Aic)?;
fit.spectral_energy_filter()?;

println!("Domain: {:?}", fit.x_range());
println!("Coefficients: {:?}", fit.coefficients());
```

This uses the orthogonal properties of your basis to get a property for each coefficient called energy, which is a measure of how much that coefficient contributes to the overall shape of the function.

Generalized Cross-Validation (GCV) is then used to determine an optimal cutoff point, to determine which coefficients contribute mostly noise, and which contribute to the true underlying signal.

Finally an attenuation effect (Lanczos-Sigma filter) is applied to the remaining coefficients to smooth out any artifacts from the filtering process.

This is a powerful technique that can produce very smooth functions from noisy data, while preserving important features and trends.