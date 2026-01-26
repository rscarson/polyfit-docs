This recipe shows ways to leverage calculus concepts when using polyfit. It will introduce calculus concepts in terms of practical applications they provide

## What this will do
- Use @[critical-point] to find where a function changes direction
- Use @[derivative] to find rates of change at specific points
- Use @[integral] to find total value over an interval

## Why would I want to do this?
- To find parts of a dataset where the trend changes direction (maxima/minima)
- To understand how quickly a measurement changes over the dataset
- To estimate the total accumulation of a quantity given a dataset representing samples in a smooth process

## How do I write tests for this?
- [assert_close!()](/testing#assert_close) to verify derivative and integral results
- [assert_is_derivative!()](/testing#assert_is_derivative) to verify derivative polynomials
- [Fits for generating graphs](/recipes#fits-for-generating-graphs) to create graphs for visual verification of critical points

-----

# Derivatives
The derivative of a function gives the rate of change of that function at any given point - think speed vs acceleration.

So for example:
- If you have a dataset of quantity vs time, the derivative will give you the rate of change of that quantity over time (i.e. how quickly it is increasing or decreasing)
- If you have a dataset of position vs time, the derivative will give you velocity (how quickly position is changing over time)
- If you have a dataset of joules vs time, the derivative will give you power (how quickly energy is being used or generated)

In polyfit, you can compute the derivative of a fitted polynomial using the `derivative` method. For example:

```rust
let fit = FourierFit::new_auto(data, DegreeBound::Relaxed, &Aic)?;
let dx = fit.as_polynomial().derivative()?;
let rate_of_change_at_x = dx.evaluate(x);
```

For example, see the graph below - it looks very complicated by you can ignore everything but the blue and green lines here:
- The blue line is the original function fitted to some data (in red dots)
- The green line is the derivative of that function, showing how quickly the blue line is changing
- You can see that when the green line crosses zero, the blue line is at a peak or valley (a critical point)

![Derivative Example](/images/recipes/using_calculus/derivative.png)


# Critical Points
Formally, a critical point is where the derivative of a function is zero or undefined. 

In practice, this just means that the function changes direction at that point (from increasing to decreasing, or vice versa).

For example, you if you have a dataset of temperature vs time, critical points would represent times when the temperature stops rising and starts falling (a maxima), or stops falling and starts rising (a minima).

Critical points come in 3 flavors:
- Minima - where the function goes from decreasing to increasing (a valley)
- Maxima - where the function goes from increasing to decreasing (a peak)
- Inflection Points - where the function changes concavity (from curving up to curving down, or vice versa)

You can find critical points by finding where the derivative is zero. In polyfit, you can use the `critical_points` method, which also classifies the type of critical point:

```rust
let fit = FourierFit::new_auto(data, DegreeBound::Relaxed, &Aic)?;
let critical_points = fit.critical_points()?;
for p in critical_points {
    match p {
        CriticalPoint::Minima(x, _y_) => println!("Found a minima at x = {}", x),
        CriticalPoint::Maxima(x, _y_) => println!("Found a maxima at x = {}", x),
        CriticalPoint::Inflection(x, _y_) => println!("Found an inflection point at x = {}", x),
    }
}
```

Now let's look at the same graph as before, but this time with critical points marked:

![Critical Points Example](/images/recipes/using_calculus/critical_points.png)

It isn't the prettiest graph ever designed, but you can see the labelled `x`s marking the critical points on the blue line.

Wherever you see an `X`, you can see that the green derivative line crosses zero.

# Integrals
An integral gives the total accumulation of a quantity over an interval.

For example:
- If you have a dataset of speed vs time, the integral will give you total distance traveled
- If you have a dataset of power vs time, the integral will give you total energy used
- If you have a dataset of flow rate vs time, the integral will give you total volume

In polyfit, you can compute the integral of a fitted polynomial using the `integral` method. For example:

```rust
let fit = FourierFit::new_auto(data, DegreeBound::Relaxed, &Aic)?;
let integral = fit.as_polynomial().integral()?;
```

But most of the time you probably just need `fit.area_under_curve(a, b)` to get the definite integral between two points `a` and `b`. For example:

```rust
let fit = FourierFit::new_auto(data, DegreeBound::Relaxed, &Aic)?;
let total_value = fit.area_under_curve(0.0, 20.0)?;
println!("Total accumulated value from x=0 to x=20 is {total_value}");
```