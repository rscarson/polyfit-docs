This recipe shows how you'd select which polynomial basis to use when fitting data with Polyfit.

## What this will do
- Demonstrate how to select a polynomial basis given varying amounts of domain-specific knowledge about the data
- Explain when to use different bases for fitting
- Discuss the tradeoffs of different bases

## Why would I want to do this?
Different polynomial bases have different strengths and weaknesses. Choosing the right basis can improve the numerical stability of the fit, reduce overfitting, and make the resulting polynomial easier to interpret.

The limitations and properties of each basis also determine which bases are suitable for different use cases.

## How do I write tests for this?
- [Validating your choice of basis](/testing#validating-your-choice-of-basis)

-----

# Once I do this how do I know I picked the right one?
That's why I wrote [Validating your choice of basis](/testing#validating-your-choice-of-basis) - it walks you through how to check that your choice of basis is appropriate for your data and use case.

# What are my options?

Custom bases can be created by implementing the [[basis::Basis]] trait, but Polyfit comes with several built-in bases that cover most use cases:
- **Monomial** - The standard polynomial basis (e.g. `3x^2 + 2x + 1`). Easy to read and understand, but can be numerically unstable for high-degree polynomials or poorly scaled data.
- **Chebyshev** - A numerically stable basis that minimizes the maximum error over an interval. Good for general-purpose fitting, especially when the data is noisy or has high variance.
- **Legendre** - An orthogonal basis that is useful for fitting data on a finite interval. Often used in physics and engineering applications.
- **Laguerre** - A basis suitable for fitting data that decays exponentially. Commonly used in quantum mechanics and other scientific fields.
- **Hermite** - A basis used for fitting data with Gaussian-like behavior. Useful in probability theory and statistics.
- **Fourier** - A basis for fitting periodic data. Ideal for applications involving waves, signals, and other cyclical phenomena.
- **Logarithmic** - A basis for fitting data that grows or decays logarithmically. Useful in fields like economics and biology.

# How do I choose?

The choice of basis depends on the characteristics of your data and the specific requirements of your application. Here are some questions you can use to narrow down your options.

If you simply want a good general-purpose basis and don't have specific requirements, [Chebyshev](recipes#getting-started) is often a safe and effective choice.

See [`basis_select!()`](recipes#using-basisselect) for a function that can help automate the process of selecting a basis.

## What am I trying to do with the polynomial?
First, consider what you need the polynomial to do, to eliminate bases that don't support those features.

> ### Do I need to communicate the formula to people?
> For communication, prefer the standard monomial form `y(x) = 1x³ + 2x² - 3x + 4` form.
>
> That narrows your options to the **Monomial** basis, and those that implement [[basis::IntoMonomialBasis]]:
>
> **Monomial | Chebyshev | Legendre | Laguerre | Hermite**

> ### Do I need to get the integral of the polynomial?
> For calculations like the area under the curve (total value over a range of X), or the average value of the polynomial over an interval, you need a basis that supports indefinite integration.
>
> That narrows your options to those that implement [[`basis::IntegralBasis`]] or can be converted to one that does.
>
> **Monomial | Chebyshev | Legendre | Laguerre | Hermite | Fourier**

> ### Do I need the the derivative of the polynomial?
> To find slopes, rates of change, inflection points, or local extrema, you need a basis that supports differentiation.
>
> That narrows your options to those that implement [[`basis::DifferentialBasis`]] or can be converted to one that does.
>
> **Monomial | Chebyshev | Legendre | Laguerre | Hermite | Fourier**

> ### Do I need advanced noise filtering?
> For very noisy data, or data with a wide [domain](glossary#domain), or large outliers, using an Orthogonal basis can improve @[numerical-stability] and allow for advanced [filtering techniques](recipes#filtering_out_noise), and super-stable @[projection].
>
> That narrows your options to the Orthogonal bases (those that implement [[`basis::OrthogonalBasis`]]).
>
> **Chebyshev | Legendre | Laguerre | Hermite | Fourier**

## What kind of data do I have?
Next, consider the characteristics of your data to further narrow down your options.

> ### Does my data cycle, repeat, or go up and down a lot?
> This covers things like RF data, audio signals, seasonal trends, or any data that has a periodic nature. **Fourier** basis is designed for this kind of data, but since **Chebyshev** uses cosines too, it's also a reasonable choice.
>
> **Fourier | Chebyshev**

> ### Does my data cluster around a mean value, with outliers following a normal/Gaussian distribution?
> For bell-curved data, or data that follows a normal distribution, the **Hermite** basis is a good choice. This covers things like measurement errors, test scores, and natural phenomena.
>
> **Hermite | Fourier**

> ### Does my data grow or shrink very quickly?
> For data that grows or decays exponentially, such as radioactive decay, population growth, or certain financial models, the **Laguerre** basis is well-suited.
>
> **Laguerre | Chebyshev**

# Using `basis_select!()`

Ok but that barely narrowed it down I thought I didn't need to understand any of this

You don't! That's why I included [[basis_select!]]

It's a macro that takes your data and runs it against every basis I support, giving you a score for each one based on how well it fits the data:

```text
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
 - Params: Number of parameters (coefficients) in the fitted model. Less means simpler model, less risk of overfitting.
 - Score Weight: Relative likelihood of being the best model among the options tested, based on the scoring method used.
 - Fit Quality: Proportion of variance in the data explained by the model (uses huber loss weighted r2).
 - Normality: How closely the residuals follow a normal distribution (useless for small datasets).
 - Rating: Combined score (0.75 * Fit Quality + 0.25 * Normality) to give an overall quality measure.
 - Stars: A simple star rating out of 5 based on the Rating score. Not scientific.
 - The best 3 models are shown below with their equations and plots (if enabled).
```

This gives you a ranked list of bases to choose from, along with some metrics to help you decide.

The 2 most important metrics are **Score Weight** and **Rating** (which is a combination of Fit Quality and Normality):
- **Score Weight** indicates how likely each basis is to be the best choice for your data, relative to the others tested.
- **Rating** gives an overall quality measure of the fit, combining how well the model explains the data the chances that underlying trends or patterns were missed.

Each basis also comes with a plot of the fit, and the polynomial equation itself, so you can visually inspect how well it fits your data.

**IMPORTANT:** The results of `basis_select!()` are only as good as the data you provide. If your dataset is small, noisy, or unrepresentative of the underlying trends, the recommendations may not be accurate. Run it more than once, with different data sets, with as many points as you can, and consider the ones that consistently rank highly.