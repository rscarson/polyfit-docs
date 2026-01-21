As a curve fitting library, Polyfit does curve fitting. What's more interesting is that I do it a way that avoids most common footguns and doesn't make you come up with numerical parameters without context.

For example, selecting which degree polynomial to fit to your data is often a black art:
- How many models should you test?
- How do you compare them?

[[CurveFit::new_auto]] is the example I am most proud of:

```rust
use polyfit::ChebyshevFit;            // Or any basis - Chebyshev is a good default though
use polyfit::score::Aic;            // Or Bic, but Aic works great for smallish datasets (< ~1000 points)
use polyfit::statistics::DegreeBound; // Conservative for smoother data, relaxed for most data or if unsure. Or custom if you want to get fancy.

let data = vec![ /* your (x, y) data */ ];
let fit = ChebyshevFit::new_auto(&data, DegreeBound::Relaxed, &Aic)?;
```

Under the hood:
- [[statistics::DegreeBound]] uses 4 different heuristics to pick a maximum degree to test based on your data
- [[score::Aic]] uses something called Huber loss to measure how well each model fits your data while being robust to outliers
- [[CurveFit::new_auto]] then fits models from degree 0 up to the maximum, and picks the simplest model that is statistically indestinguishable from the best fitting model

It's all described in detail in the `Technical Details` warning blocks I have sprinkled throughout the documentation, but it's intuitive and safe even with zero knowledge of statistics.

Other fitting methods are available too, such as:
- Cross-validation based scoring (for very noisy data - [[CurveFit::new_kfold_cross_validated]])
- Weighted fitting (it's an @[orthogonality] thing - [[CurveFit::new_weighted]])
- Plain old ordinary fitting (if you know the degree you need already - [[CurveFit::new]])

Once you have a fit you can:
- Evaluate it at new points - [[CurveFit::y]]
- Get outliers, uncertainty and other stuff - [[CurveFit::covariance]] [[CurveFitCovariance]]