This recipe demonstrates how to graphs of data, functions, and polynomial fits using Polyfit's plotting capabilities.

Note that the `plotting` feature is needed for this recipe.

## What this will do
- Generate plots of raw data points
- Plot polynomial fits over data
- Visualize residuals
- Show how to customize plots

## Why would I want to do this?
- Easier debugging of fits
- Visual confirmation of model accuracy
- Generated automatically as part of testing so you should probably know what they look like

-----

# Generating Graphs with Polyfit
The [[plotting]] module in Polyfit provides functionality to create visualizations of your data and polynomial fits, mostly for debugging and testing purposes.

It has some convenience macros, decent customization options, and filename generation.

By default it uses plotters, but the trait-based design means you can implement your own backends if you want to, or you can [open a GitHub issue](https://github.com/rscarson/polyfit/issues/new) to request additional backends.

We will be plotting the following function in this recipe:

```rust
use polyfit::ChebyshevFit;
use polyfit::statistics::{DegreeBound};
use polyfit::score::Aic;

// Chebyshev is a good general purpose basis for data you don't know much about
// It is orthogonal, which helps with numerical stability and avoiding overfitting
let fit = ChebyshevFit::new_auto(
    &data,                // The data to fit to
    DegreeBound::Relaxed, // How picky we are about the degree of the polynomial (See [`statistics::DegreeBound`])
    &Aic,                 // How to score the fits (See [`crate::score`])
)?;
```

## Plotting the fit
A [[CurveFit]] will be plotted with error bars over the values, and the original data points will be shown as dots.

Error bars and anything else can be customized using any of the options in [[plotting::PlotOptions]].

The simplest way to plot a fit is to use the [[plot]] macro:

```rust
use polyfit::plot;

plot!(fit); // Default options

plot!(fit, prefix = "filename_prefix"); // Custom filename prefix

// Customized options
plot!(fit, {
    title: "Chebyshev Fit to Sample Data".to_string(),
    x_label: Some("X Axis".to_string()),
    y_label: Some("Y Axis".to_string()),
}, prefix = "filename_prefix");
```

This will generate a PNG file with the plot of the fit, in the `target/plot_output/` directory by default.

## Plotting residuals
For more details on how to interpret the residuals of a fit, see [Evaluating Visually with Residuals](/testing#evaluating-visually-with-residuals).

Residuals are the differences between the observed values and the values predicted by the model. Plotting residuals can help you identify patterns that indicate how well your model fits the data.

In general you want the residuals to be small, and randomly distributed around zero. If you see patterns in the residuals, it may indicate that your model is not capturing some aspect of the data (underfitting) or is too complex (overfitting).

You can plot the residuals of a fit using the [[plot_residuals]] macro:

```rust
use polyfit::plot_residuals;
plot_residuals!(fit); // Supports same options as `plot!`
```

> ### Important
> Mathematically, a QQ plot is the gold standard for evaluating residuals.
>
> However, without foreknowledge of how to interpret them, a layperson is not likely to get much out of them.
>
> I therefore made the decision to implement simple residual plots instead, which can at a glance give you a good idea of how well your model is performing.

# Doing it the hard way
If you want more control over the plotting process, you don't need to use the macros. This gives you access to more customization options, and different backends if you have implemented them, or if I implemented them and forgot to update this recipe.

## Setting up the backend
First, you need to set up the plotting backend. By default, Polyfit uses Plotters.

A plot uses a `Root` object to manage the drawing area, and has a single function that is added at creation to determine axes ranges if not specified in the options.

```rust
use polyfit::{self, PlottingElement};
use polyfit::plot_filename;

let path = plot_filename!(Some("custom_prefix")); // Generate a filename
let options = plotting::PlotOptions::<_>::default();
let root = plotting::plotters::Root::new(&path, options.size);
let mut plot =
    plotting::Plot::<plotting::plotters::Backend, _>::new(&root, options, &fit)?;
```

## Adding elements to the plot
You can add multiple elements to a plot, such as the fit line, data points, residuals, etc.

For example, marking a specific point on the plot can be done like this:

```rust
let element = PlottingElement::Markers(vec![(25.0, 20_000.0, Some("OoogaBooga".to_string()))]);
plot.with_element(&element)?;
```

Or other data sets:

```rust
let element = PlottingElement::Data(
    vec![(10.0, 20.0), (20.0, 5.0), (30.0, 15.0)],
    Some("My neat data".to_string()),
);
plot.with_element(&element)?;
```

## Finalizing the plot
Once you have added all the elements you want, you can finalize and save the plot:

```rust
plot.finish()?;
drop(root); // For good luck
```