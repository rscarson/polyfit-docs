This recipe demonstrates how you can use various data transforms to improve accuracy and performance of your models.

Note that the `transforms` feature is needed for this recipe.

## What this will do
- Scale numerical features to a standard range
- Normalize data by centering, scaling, or transforming distributions
- Demonstrate polynomial scaling for unit conversion

## Why would I want to do this?
- Can yield more accurate polynomial fits
- Reduce the effect of outliers
- Improve @[numerical-stability] while fitting
- Apply domain-specific changes to a whole dataset

## How do I write tests for this?
- Generate noisy test data with [Simulating noisy data for testing](/testing#simulating-noisy-data-for-testing)
- Verify that scaling improves fit metrics like [[CurveFit::r_squared]] or reduces error metrics like [[statistics::root_mean_squared_error]]

-----

# Normalization: Taming bad data

Normalization is the process of adjusting values in order to make them easier to work with. This is especially useful when dealing with data that has outliers, very wide ranges, etc.

In this section, we will cover the normalization techniques available in Polyfit.

[[transforms::ApplyNormalization]] is the main trait used to apply normalization techniques.

## Domain normalization

Domain normalization involves adjusting the input (x) values of your data to a standard range, typically [0, 1] or [-1, 1]. This can help improve the performance of polynomial fits by reducing numerical instability.

Most of the time, you won't need to do this yourself as Polyfit will perform domain normalization automatically to best suit the basis you have selected. 

If you do want to do this, for example transforming data to the range [0, 1] gives you a relative percentage representation of your input data, you can use [[statistics::DomainNormalizer]] or [[transforms::ApplyNormalization::apply_domain_normalization]]:

Either with the transform method for whole datasets:

```rust
use polyfit::transforms::ApplyNormalization;
data.apply_domain_normalization(0.0, 1.0);
```

Or by creating a normalizer and using it to normalize individual values:

```rust
use polyfit::statistics::DomainNormalizer;
use polyfit::value::CoordExt;

let normalizer = statistics::DomainNormalizer::from_data(data.x_iter(), (0.0, 1.0));
let normalized_x = normalizer.normalize(x_value_to_use);
```

## Clipping

Another example of a boundary-based normalization technique is clipping. This involves setting a minimum and maximum threshold for your data, and any values outside of this range are set to the nearest boundary value.

For example if your data represents percentages, you might want to clip values to the range [0, 100]:

```rust
use polyfit::transforms::ApplyNormalization;
data.apply_clipping(0.0, 100.0);
```

## Mean subtraction

The @[mean] of a dataset is the average value. Mean subtraction involves subtracting the mean from each data point, effectively centering the data around zero. This can be useful for removing bias in the data.

This can often be an easy preprocessing step to improve fit accuracy; you will see the biggest improvements when your data has a significant offset from zero.

```rust
use polyfit::transforms::ApplyNormalization;
data.apply_mean_subtraction();
```

## Z-score normalization

The z-score is a measure of how many standard deviations a data point is from the mean. Z-score normalization involves transforming the data so that it has a mean of 0 and a standard deviation of 1. This is done by subtracting the mean and dividing by the standard deviation for each data point.

This technique is particularly useful when dealing with data that has a normal distribution, which covers most real-world datasets.

```rust
use polyfit::transforms::ApplyNormalization;
data.apply_z_score_normalization();
```

# Scaling: Altering the range and representation of data

Scaling involves changing the range or representation of your data. 

This is particularly useful in domain-specific applications where certain transformations can make the data more interpretable or easier to work with.

## Shifting

Shifting involves adding or subtracting a constant value to each data point. This can be useful for adjusting the baseline of your data.

```rust
use polyfit::transforms::ApplyNormalization;
data.apply_shifting(10.0); // Shift all data points up by 10
```

## Linear scaling
Linear scaling involves multiplying each data point by a constant factor. This can be useful for converting units or adjusting the scale of your data.

For example let's convert volts to megavolts:

```rust
use polyfit::transforms::ApplyNormalization;
data.apply_linear_scale(1e-6); // Scale all data points to megavolts
```

## Quadratic and Cubic scaling
Quadratic and cubic scaling involve raising each data point to the power of 2 or 3, respectively and multiplying by a constant factor. This can be useful for modeling relationships that are inherently quadratic or cubic in nature, such as area or volume calculations.

```rust
use polyfit::transforms::ApplyNormalization;
data.apply_quadratic_scale(1.0); // Square all data points
data.apply_cubic_scale(1.0);     // Cube all data points
```

## Exponential scaling
Exponential scaling involves raising a constant base to the power of each data point and multiplying by a constant factor. This can be useful for modeling exponential growth or decay processes.

```rust
use polyfit::transforms::ApplyNormalization;
data.apply_exponential_scale(2.0, 1.0); // Apply base-2 exponential scaling with a constant factor of 1.0
```

## Logarithmic scaling
Logarithmic scaling involves taking the logarithm of each data point with a specified base and multiplying by a constant factor. This can be useful for compressing wide-ranging data or modeling phenomena that follow a logarithmic scale.

```rust
use polyfit::transforms::ApplyNormalization;
data.apply_logarithmic_scale(10.0, 1.0); // Apply base-10 logarithmic scaling with a constant factor of 1.0
```

## Polynomial scaling
Polynomial scaling involves applying a polynomial transformation to each data point. This can be useful for modeling complex relationships that are best represented by polynomials.

Let's suppose we have sensor readings of temperature over time (celsius / seconds), and the sensor voltage follows a quadratic relation:

`V = 0.01T² + 0.5T`

We can use a polynomial to model this relationship

```rust
use polyfit::transforms::ApplyNormalization;
use polyfit::function;

function!(voltage(x) = 0.01 x^2 + 0.5 x);
let voltage_data = data.apply_polynomial_scale(&voltage);
```

The result is a new dataset where the y values represent the voltage readings corresponding to the original temperature readings.