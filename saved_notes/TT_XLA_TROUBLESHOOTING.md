# TT-XLA Troubleshooting: "invalid node; first invalid key: host_ranks"

## Error Description

```
RuntimeError: invalid node; first invalid key: "host_ranks"
RuntimeError: Unable to initialize backend 'tt': invalid node; first invalid key: "host_ranks"
```

## Root Cause

The PJRT plugin configuration is looking for multi-host/multi-device parameters that aren't needed for single-chip N150 setup. This is likely due to:
1. Version mismatch between pjrt-plugin-tt wheel and tt-metal
2. Missing environment configuration
3. Need for nightly/pre-release version

## Solutions to Try

### Solution 1: Try Pre-Release (Nightly) Wheel

The stable wheel might not be compatible with your tt-metal version. Try the nightly:

```bash
source ~/tt-xla-venv/bin/activate
pip uninstall pjrt-plugin-tt
pip install --pre pjrt-plugin-tt --extra-index-url https://pypi.eng.aws.tenstorrent.com/ --force-reinstall
pip install --upgrade jax jaxlib
```

Then test again:
```bash
python3 ~/tt-scratchpad/test-tt-xla.py
```

### Solution 2: Set JAX Platform Explicitly

Force JAX to use only the TT platform:

```bash
export JAX_PLATFORMS=tt
python3 ~/tt-scratchpad/test-tt-xla.py
```

### Solution 3: Disable Multi-Device Configuration

Create a configuration file to force single-device mode:

```bash
cat > ~/tt-scratchpad/test-tt-xla-fixed.py << 'EOF'
#!/usr/bin/env python3
"""
Test TT-XLA installation with explicit single-device configuration.
"""
import os
os.environ['JAX_PLATFORMS'] = 'tt'
os.environ['PJRT_DEVICE'] = 'TT'

import jax
import jax.numpy as jnp

# Force single-device configuration
jax.config.update('jax_platform_name', 'tt')

# Check available devices
print("Available JAX devices:")
try:
    devices = jax.devices()
    print(devices)

    if devices:
        # Try a simple computation
        x = jnp.array([1.0, 2.0, 3.0])
        y = jnp.array([4.0, 5.0, 6.0])

        result = jnp.dot(x, y)
        print(f"\nDot product result: {result}")
        print(f"Result device: {result.device()}")
        print("\n✓ TT-XLA is working!")
    else:
        print("No TT devices found")
except Exception as e:
    print(f"Error: {e}")
    print("\nTrying CPU fallback...")
    os.environ['JAX_PLATFORMS'] = 'cpu'
    import jax as jax_cpu
    print(jax_cpu.devices())
EOF

python3 ~/tt-scratchpad/test-tt-xla-fixed.py
```

### Solution 4: Check Installed Versions

Verify what was installed:

```bash
source ~/tt-xla-venv/bin/activate
pip list | grep -E 'pjrt|jax'
```

Expected output should show:
- `pjrt-plugin-tt` (version X.X.X)
- `jax` (version 0.4.x or later)
- `jaxlib` (version 0.4.x or later)

### Solution 5: Try CPU Backend First

To verify JAX itself works, try CPU:

```bash
cat > ~/tt-scratchpad/test-jax-cpu.py << 'EOF'
import os
os.environ['JAX_PLATFORMS'] = 'cpu'

import jax
import jax.numpy as jnp

print("Available JAX devices (CPU):")
print(jax.devices())

x = jnp.array([1.0, 2.0, 3.0])
y = jnp.array([4.0, 5.0, 6.0])
result = jnp.dot(x, y)

print(f"\nDot product result: {result}")
print("✓ JAX works on CPU!")
EOF

python3 ~/tt-scratchpad/test-jax-cpu.py
```

If this works, JAX is installed correctly and the issue is specifically with the TT PJRT plugin.

### Solution 6: Check tt-metal Compatibility

Your tt-metal SHA (9b67e09) might need a specific version of the plugin. Check the release notes:

```bash
# Check your tt-metal version
cd ~/tt-metal
git log --oneline -1
git describe --tags

# Check if there are compatibility notes
curl -s https://raw.githubusercontent.com/tenstorrent/tt-xla/main/README.md | grep -A 10 "Compatibility"
```

### Solution 7: Build from Source (Last Resort)

If wheels don't work, you may need to build from source:

```bash
cd ~
git clone https://github.com/tenstorrent/tt-xla.git
cd tt-xla

# Check build instructions
cat README.md

# Typical build process:
python3 -m venv venv
source venv/bin/activate
pip install -e .
```

## Recommended Debugging Sequence

Try these in order:

1. **First, try Solution 1 (nightly wheel)** - Most likely fix
   ```bash
   pip install --pre pjrt-plugin-tt --extra-index-url https://pypi.eng.aws.tenstorrent.com/ --force-reinstall
   ```

2. **Then try Solution 2 (explicit platform)**
   ```bash
   export JAX_PLATFORMS=tt
   python3 test-tt-xla.py
   ```

3. **Check versions (Solution 4)**
   ```bash
   pip list | grep -E 'pjrt|jax'
   ```

4. **If still failing, try CPU test (Solution 5)** to isolate if it's JAX or TT plugin

5. **Check compatibility docs (Solution 6)**

6. **Last resort: build from source (Solution 7)**

## Alternative: Use TT-Forge Instead

If TT-XLA continues to have issues, you might need to:
1. Upgrade Python to 3.11 (if possible)
2. Try TT-Forge (Lesson 11) which has different requirements
3. Or stick with TT-Metal direct API (Lessons 1-10)

## Expected Working Output

When it works, you should see:
```
Available JAX devices:
WARNING:... Platform 'tt' is experimental...
[TtDevice(id=0)]

Dot product result: 32.0
Result device: TtDevice(id=0)

✓ TT-XLA is working!
```

## Reporting Issues

If none of these work, please report:
1. Output of `pip list | grep -E 'pjrt|jax'`
2. Output of `cd ~/tt-metal && git rev-parse HEAD`
3. Output of `tt-smi`
4. Full error traceback

To: https://github.com/tenstorrent/tt-xla/issues
