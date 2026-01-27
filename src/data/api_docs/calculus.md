Calculus operations are available in most choices of @[basis] (See [Basis Selection](/tutorials#basis-selection-what-am-i-trying-to-do-with-the-polynomial) for more information).

Polyfit supports indefinite integration and differentiation in many bases, the practical applications of which are described in more details in the [Using Calculus](/tutorials#using-calculus) recipe.

> ## Derivatives for Trend Analysis
> The derivative describes the rate of change at specific points in a dataset.  
> For example the derivative of position with respect to time is velocity, and the derivative of velocity with respect to time is acceleration. 
>
> ### Find the derivative of a function
> - [[CurveFit::as_polynomial]] | [[Polynomial::derivative]]
>
> ### Find local maximums and minimums
> - [[Polynomial::critical_points]]
> - [[Polynomial::roots]] | [[Polynomial::real_roots]]
>
> ### Find out if a function changes direction (monotonicity)
> - [[Polynomial::monotonicity_violations]]

> ## Integrals for Total Values
> The integral represents the accumulation of quantities, such as total distance traveled or total growth over time.
> 
> ### Find the integral of a function
> - [[CurveFit::as_polynomial]] | [[Polynomial::integral]]
>
> ## Get the total value over a range (definite integral)
> - [[Polynomial::area_under_curve]]

> ## Custom Bases
> If you are using a custom basis, implement the [[basis::DifferentialBasis]] and/or [[basis::IntegralBasis]] traits to enable differentiation and/or integration for that basis.