I built in an optional [[transforms]] feature with 3 different classes of transforms:

> ## Normalization Transforms
> [[transforms::NormalizationTransform]] [[transforms::ApplyNormalization]]
>
> Choose from Domain, Clipping, Mean Subtraction, or Z-score normalization to preprocess your data before fitting.
>
> Great for improving numerical stability and fit quality, especially for high degree polynomials or large ranges of data.

> ## Noise Transforms
> [[transforms::NoiseTransform]] [[transforms::ApplyNoise]]
>
> Generate synthetic noisy datasets by adding one of several types of configurable noise - each option has a plot showing
> its characteristics and the effect of each parameter.
>
> - Normal (Gaussian) Noise
> - Correlated Gaussian Noise
> - Uniform Noise
> - Salt and Pepper Noise
> - Impulse Noise
> - Poisson Noise

> ## Scaling Transforms
> [[transforms::ScaleTransform]] [[transforms::ApplyScale]]
>
> Transform data by applying scaling functions. Can improve fit quality or be used for data conversions
> - Shift
> - Linear Scale
> - Quadratic Scale
> - Cubic Scale
> - Exponential Scale
> - Logarithmic Scale
> - Or polynomial scale where you just give a function or fit to apply
> 
> These can be composed together to create complex preprocessing pipelines before fitting your data.