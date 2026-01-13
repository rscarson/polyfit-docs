Here is a basic example of using the `polyfit` crate to fit a polynomial to some data.

## What this will do
- Load some sample data from a JSON file
- Find a polynomial function that fits the data
- Evaluate that function at a set of points
- (Optionally) Plot the data and the fitted function to a PNG

## Why would I want to do this?
If you have a set of data points and want to:
- Identify trends in the data
- Find outlier points that don't fit the rest of the data
- Draw a smooth curve through noisy data on a plot
- Predict values between known data points

## How do I write tests for this?
- [Evaluating Fit Quality](testing#evaluating-fit-quality)
- [Basis Selection](recipes#basis-selection)

-----

# Loading Data

The `CurveFit` expects data in the form of a slice of `(x, y)` tuples. In this example I am using `f64` but polyfit is generic over many floating point types.

Here we load some sample data from a JSON file included in the binary at compile time:

```rust
let data = include_str!("sample_data.json");
let data: Vec<(f64, f64)> = serde_json::from_str(data).unwrap();
```

# Choosing a Basis

Polynomials can be represented in different types of functions, called a basis. Most people are familiar with the [Monomial basis](glossary#basis-monomial) (i.e. standard polynomials like `3x^2 + 2x + 1`), but other bases can be more numerically stable or have other advantages.

In this example we will use the [Chebyshev basis](glossary#basis-chebyshev), which a more [stable](glossary#numerical-stability) general purpose basis that works well for a wide range of data.

See [`basis_select!()`](testing#basis_select) for a good way to choose a basis for your data set.

# Fitting the Data

Let's use the chosen basis to fit the data using a `ChebyshevFit`, which is just an alias for `CurveFit<ChebyshevBasis>`.

We don't know the best degree for the polynomial yet, so we will use `CurveFit::new_auto(data, max_degree, scoring_method)` to automatically select the best degree based on the data.

## Finding the best degree

We want to find the simplest possible model that still fits the data well. To do this, `new_auto` will create a range of candidates with different polynomial degrees, and compare them.

**The range of degrees** to try is determined by the `max_degree` parameter, which accepts a value of type [[statistics::DegreeBound]]:
- `DegreeBound::Conservative` - Use this for smoother data with low noise. This will try fewer candidate degrees.
- `DegreeBound::Relaxed` - Use this for data with more noise or complexity. This will try more candidate degrees.
- `DegreeBound::Custom(n)` - Try all degrees up to `n`. Use this if you have a specific maximum degree in mind and understand the implications.

**The method of scoring** the different candidates is determined by the `scoring_method` parameter, which accepts any type that implements the [[score::ModelScoreProvider]] trait. In this example I use [Akaike Information Criterion (AIC)](glossary#akaike-information-criterion), which is a good balance between fit quality and model simplicity. Bic is another option, but it tends to favor simpler models more strongly.

## Putting it together

The last addition we will have here, is `prune_insignificant()`.  Sometimes a least-squares fit will include terms that don't really contribute much, so we remove these insignificant terms to get a simpler polynomial. 

This step is entirely optional, but can help reduce overfitting and make the resulting polynomial easier to interpret.
The level of confidence you choose generally depends on your domain (For example, in scientific research you might choose a higher confidence level), or the the required precision of the fit.

In the example below, we request a Chebyshev fit with an automatically selected degree (using a relaxed degree bound and AIC scoring), and then prune terms we are 95% confident are not statistically significant:

```rust
use polyfit::{
    score::Aic,
    statistics::Confidence,
    statistics::DegreeBound,
    ChebyshevFit,
};

let mut fit = ChebyshevFit::new_auto(&data, DegreeBound::Relaxed, &Aic)?;
fit.prune_insignificant(Confidence::P95)?;
```

# Using the Fit

Great! Now we have a fitted polynomial. Let's see how well it fits the data by calculating the R² value.

This is a value between 0 and 1 that indicates how well the polynomial explains the [variance](glossary#variance) in the data. A value close to 1 means a good fit, while a value closer to 0 means a poor fit.

```rust
let r_squared = fit.r_squared(fit.data());
if r_squared < 0.9 {
    eprintln!("Warning: Low R² - noisy data or poor fit: {}", r_squared);
}
```

## But I need the polynomial equation!

The Chebyshev basis is great for fitting, but not the most human-friendly to read. Luckily it is one of many bases that can be converted to an exact equivalent polynomial in the Monomial basis.

This monomial retains all the same fit properties, but is easier to read and understand:

```rust
let poly = fit.as_monomial()?;
println!("Fitted Polynomial: {poly}");
```

## I need to draw a pretty line though

The reason I wrote this crate was 50% outlier detection, and 50% plotting smooth curves for my UI.

If you want to generate points from the fit for plotting, you can use `solve_range()` to get evenly spaced points over a range, or `solve()` to evaluate specific points:

```rust
let fitted_points = fit.solve_range(0.0..=99.0, 1.0)?; // Points from 0 to 99, every 1.0 units
let fitted_points = fit.solve([42.0, 76.0, 89.9])?; // Specific points
```

```rust
use polyfit::{
    error::Error,
    score::Aic,
    statistics::{Confidence, DegreeBound},
    ChebyshevFit,
};
```

But if you have the `plotting` feature enabled, you can plot the fit and data to a PNG file with a single macro call:

```rust
polyfit::plot!(fit);
```

The console will output the location of the generated PNG file, which will be created in the `target/plot_output/` directory with a unique name.
