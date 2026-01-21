After I built this library I realized that debugging curve fits is a pain without visualization. So I added some plotting utilities, and made my whole test suite generate plots on failure.

Use the [[plot]] macro to create plots from data and fits. For example, to plot some data and a fit:

```rust
use polyfit::ChebyshevFit;
use polyfit::plot;

let data = vec![ /* your (x, y) data */ ];
let fit = ChebyshevFit::new(&data, 3)?; // 3rd degree fit
plot!(fit);
```

You can plot data, functions, and multiple things at once, and theres a lot of customization available. See [[plotting::PlotOptions]] for details.

By default they use `plotters`, but you can implement the [[plotting::PlotBackend]] trait to add support for other backends if you want.