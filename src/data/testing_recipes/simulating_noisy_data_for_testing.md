This recipe will show you how to simulate noisy data for testing purposes, making it easier to evaluate how well your functions handle different kinds of imperfections.

## What this will do

- Show how to add various types of noise to simulate real-world imperfections
- Provide an example of simulating a noisy RF signal for testing
- Explain the parameters used for different noise types
- Demonstrate how to visualize the effects of added noise
- Give tips on reproducibility using random seeds
- Show how to use the testing library to validate functions against noisy data

## Why would I want to do this?

- Testing data processing and analysis functions against real-world noisy data is often impractical
- Simulating noisy data allows for controlled testing scenarios
- Helps ensure robustness and reliability of functions when dealing with imperfect data
- Enables reproducible tests by controlling noise patterns
- Allows for comprehensive coverage of edge cases in data handling
- Provides a way to validate algorithms under various noise conditions

-----

Polyfit includes a `transforms` feature that provides a module of the same name - part of which is a set of functions for adding various types of transformations to datasets.

One of those transformations is the ability to add noise to datasets, simulating real-world imperfections.

The types of noise you can add include:

- Normal (Gaussian) noise, or white noise
- Correlated noise, of which normal noise is a special case with rho=0
- Poisson noise, which simulates random discrete events
- Salt and pepper noise, which simulates random spikes or drops in the data
- Uniform noise, which adds random values from a uniform distribution
- Impulse noise, which adds sudden spikes at random intervals

In this recipe, I will demonstrate an example of how to simulate a noisy dataset for testing purposes, in this case trying to approximate a noisy RF signal.

# Finding the initial function

First, you need a function that represents the "true" underlying data without noise. There are several way to do this, as outlined in [Finding and Using Canonical Functions](testing#finding-and-using-canonical-functions):

1. If you have access to, or can generate, a clean dataset, you can fit a model to that data, and use the resulting function as your base.
2. You can simply use a noisy dataset as the base, fit a model to it, and treat that as the "true" function.
3. You can define a mathematical function directly, such as a Fourier series, or a Monomial.

For this example, we will be generating a pseudo-RF signal, so we will use the following Fourier series as our base function (which is the gold standard for signals data), and then sample it over a range.

We are using a static function here for simplicity, but in a real-world scenario, use the recipe linked above to find a good canonical function for your data.

```rust
use polyfit::basis::FourierBasis;

let function = FourierBasis::new_polynomial((0.0, 100.0), &[0.0, 5.0, 3.5])?;
println!("Base function: {function}");

let data = function.solve_range(0.0..=100.0, 1.0);
```

This will give us a clean pseudo-RF signal that looks like this:
![Raw background signal](recipes/adding_noise/1_data.png)

# Adding noise

Now that we have our base data, we can add noise to it, to simulate the kind of variability and imperfections we might see in real-world data set.

The actual type of noise you need depend on your specific data, and how it is generated, but for example, you might want to approximate:

- The documented error of your sensors or measurement devices
- Known interference patterns in your data, like background RF noise
- Random events that can occur in your data, like spikes or dropouts
- Environmental factors that can affect your measurements, like temperature fluctuations altering sensor readings

For our pseudo-RF signal, we keep it simple, and add three types of noise in sequence:

1. Background noise - Correlated Gaussian noise to simulate general RF background interference.
2. Random events - Poisson noise to simulate random spikes or bursts in the signal.
3. Sensor glitches - Salt and pepper noise to simulate sudden drops or spikes in the signal.

You will notice that each noise addition function takes an addition parameter which we will set to `None` for now. This parameter is an optional random seed, which can be used to ensure reproducibility of the noise added. 

If provided, the same seed will always produce the same noise pattern. Otherwise a random seed will be generated each time, resulting in different noise patterns on each run.

However, if you use one of the test assertion macros, such as [assert_fits!()](testing#assert_fits), even if not specified, the test failure will list all the random seeds used in the current thread, allowing you to easily reproduce the exact noise pattern that caused the failure by reusing those seeds, for example

```
thread 'main' panicked at examples\adding_noise.rs:48:5:
Fit does not meet R² threshold: -0.7762063584670245 < 0.9
Seeds used in this test thread: [11626815249219115208, 16909925628899021677, 915904366589027789, 4579148132837542583]
Failure plot saved to: target\plot_output\assert_fits_examples_adding_noise.rs_line_48.png
```

# Background Noise

First we will add some correlated gaussian noise - several layers with varying correlation lengths and amplitudes.

The strength controls how much noise is added, and can be specified in either absolute or relative terms, while the correlation length controls how "smooth" the noise is (0 is pure white noise, while 1.0 is very smooth, low-frequency noise).

We will add two layers of background noise with different strengths and correlation lengths:

- A fairly small layer of noise with no correlation (Pure white, or high-frequency noise with ~1.5 units as the standard deviation from the base signal).
- A stronger layer of noise with a long correlation length (Very smooth, low-frequency noise, ~5.0 units as the standard deviation from the base signal, and a correlation length of 0.75).

```rust
use polyfit::transforms::{ApplyNoise, Strength};

let with_bg_noise = data.apply_normal_noise(Strength::Absolute(1.5), None);
let with_bg_noise = with_bg_noise.apply_correlated_noise(Strength::Absolute(5.0), 0.75, None);
```

For more information on the parameters used here, see [[transforms::Strength]] and [[transforms::NoiseTransform::CorrelatedGaussian]].

Now we should have a signal with a new high-frequency noise component, as well as a small corruption of the actual low-frequency parts of the original function:

![Background noise added](recipes/adding_noise/2_background_noise.png)

# Random Events

Our RF signal may also have random events, such as interference spikes, or incoming data bursts. We can simulate these by adding random spikes to the data. 

Poisson is perfect for this. It has a single parameter lambda which controls the average number of events to add. Each event will be a spike of random height at a random location in the data.

0.3 is a good starting point for lambda, which will add a few events to the data, without overwhelming the original signal:

```rust
use polyfit::transforms::ApplyNoise;
let with_events = with_bg_noise.apply_poisson_noise(0.3, None);
```

Now we have a signal with random spikes added to it, simulating interference or data bursts:

![Random events added](recipes/adding_noise/3_random_events.png)

# Sensor Glitches

Finally, we can simulate sensor glitches - sudden drops or spikes in the signal that last for a short duration. These can be caused by hardware issues or environmental factors.

Salt and pepper noise is a good way to simulate this effect - it randomly selects points in the data and replaces them with either a high or low value. For our purposes, we will replace around 1 out of every 100 points with -50 or +50:

```rust
use polyfit::transforms::ApplyNoise;
let with_glitches = with_events.apply_salt_pepper_noise(0.01, -50.0, 50.0, None);
```

A small number of large positive and negative spikes have now been added to the data, simulating sensor glitches:

![Sensor glitches added](recipes/adding_noise/4_glitches.png)

# Final Result

Now that we have our final noisy signal, we can visualize it alongside the original clean signal to see the difference:
![Final noisy signal in red, original clean signal in green, curve fit in blue](recipes/adding_noise/fit.png)

You can clearly see the effects of our noise:

1. The white noise was absorbed well, having next to no impact on fit quality.
2. The cluster of events around x=20 caused a bump in the fitted curve
3. The glitch around x=65 caused a significant bump; enough to increase the degree of the fit!

Using a similar technique, you can simulate a wide variety of noisy datasets for testing your data processing and analysis functions.

The testing library makes errors visually traceable, and the seed reporting makes it easy to reproduce specific noise patterns that cause issues. This allows you to ensure your functions are robust and reliable, even when dealing with imperfect real-world data.