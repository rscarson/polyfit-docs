As a curve fitting library, Polyfit does curve fitting. What's more interesting is that I do it a way that avoids most common footguns and doesn't make you come up with numerical parameters without context.

For example, selecting which degree polynomial to fit to your data is often a black art:
- How many models should you test?
- How do you compare them?

[[CurveFit::new_auto]] is the example I am most proud of:

```rust
use polyfit::ChebyshevFit;            // Or any basis - Chebyshev is a good default though
use polyfit::scoring::Aic;            // Or Bic, but Aic works great for smallish datasets (< ~1000 points)
use polyfit::statistics::DegreeBound; // Conservative for smoother data, relaxed for most data or if unsure. Or custom if you want to get fancy.

let data = vec![ /* your (x, y) data */ ];
let fit = ChebyshevFit::new_auto(&data, DegreeBound::Relaxed, &Aic)?;
```

Under the hood:
- [[statistics::DegreeBound]] uses 