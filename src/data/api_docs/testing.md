Being able to use a fitting library without stats knowledge isn't very useful if you can't test and validate your fits. 

To that end I built in a testing framework to make it easy to validate your fits and make sure everything is working as expected.

See the [/testing](/testing) page for details on how to use it.

It includes features like:
- Generating synthetic datasets with configurable noise and transforms
- Macros that generate a plot of your fit and data on test failure for easy debugging
- Built-in assertions for common fit properties and more complex statistical tests
- Sane auto-defaults so you don't need to guess parameters
- Seed management! Any random transforms log seeds used so you can reproduce failures easily
- I even added `transforms::SeedSource::from_seeds` to replay tests with the same random data every time after a failure