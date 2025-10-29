# Hardware Detection

Detect and verify your Tenstorrent hardware using the `tt-smi` command-line tool.

## What This Does

The `tt-smi` command scans your system for connected Tenstorrent devices and displays their status, including:
- Device model and ID
- PCIe information
- Temperature and power status
- Driver version

## Run the Command

Click the button below to run the hardware detection:

[🔍 Detect Tenstorrent Hardware](command:tenstorrent.runHardwareDetection)

## Expected Output

You should see a list of detected Tenstorrent devices with their current status. If no devices are found, check your hardware connections and driver installation.

## Learn More

For more information about tt-smi, visit the [tt-smi documentation](https://github.com/tenstorrent/tt-smi).
