# Mandelbrot Explorer

Interactive fractal renderer with GPU-style parallel computation on TT hardware.

## Features

- High-resolution Mandelbrot set rendering
- Julia set variations
- Interactive zoom and pan
- Multiple color schemes
- Performance profiling

## Quick Start

```bash
pip install -r requirements.txt

# Basic render
python renderer.py

# Interactive explorer
python explorer.py
```

## Usage

```python
from renderer import MandelbrotRenderer
from explorer import MandelbrotVisualizer
import ttnn

device = ttnn.open_device(0)
renderer = MandelbrotRenderer(device)

# Render Mandelbrot set
fractal = renderer.render(
    width=2048, height=2048,
    x_min=-2.5, x_max=1.0,
    y_min=-1.25, y_max=1.25,
    max_iter=512
)

# Interactive explorer with click-to-zoom
viz = MandelbrotVisualizer(renderer)
viz.interactive_explorer(width=1024, height=1024)

ttnn.close_device(device)
```

## Complete Implementation

See **Lesson 12** for the full 600+ line implementation including:
- MandelbrotRenderer with complex number operations
- Julia set rendering
- Interactive explorer with zoom/pan/undo
- Performance benchmarking
- Extensions (Burning Ship fractal, 3D Mandelbulb, deep zoom videos)

## Controls

- **Click**: Zoom into region
- **R**: Reset view
- **C**: Cycle color maps
- **U**: Undo zoom
- **Q**: Quit