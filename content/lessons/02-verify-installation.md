# Verify tt-metal Installation

Test your tt-metal installation by running a sample operation on your Tenstorrent device.

## What This Does

This step runs a simple test program that:
- Initializes the Tenstorrent device
- Performs a basic tensor operation
- Verifies the software stack is properly configured

## Run the Verification

This command will run a test operation on your Tenstorrent device:

```bash
python3 -m ttnn.examples.usage.run_op_on_device
```

[✓ Verify TT-Metal Installation](command:tenstorrent.verifyInstallation)

## Expected Output

You should see output indicating successful device initialization and operation completion. This confirms that:
- The tt-metal software is correctly installed
- Your device is properly configured
- You can run programs on the Tenstorrent hardware

## Try More Examples

Once verification succeeds, you can explore more examples:

- **[TT-NN Basic Examples](https://docs.tenstorrent.com/tt-metal/latest/ttnn/ttnn/usage.html#basic-examples)** - Learn fundamental tensor operations
- **[Simple Kernels on TT-Metalium](https://docs.tenstorrent.com/tt-metal/latest/tt-metalium/tt_metal/examples/index.html)** - Write custom compute kernels

## Learn More

For installation troubleshooting and detailed documentation, visit the [tt-metal installation guide](https://github.com/tenstorrent/tt-metal/blob/main/INSTALLING.md).
