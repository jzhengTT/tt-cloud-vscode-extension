# Tenstorrent VSCode Theme

A dark theme inspired by the Tenstorrent website color palette, featuring calming cyan/teal tones with pink and yellow accents.

## Color Palette

### Primary Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Primary Cyan** | `#4FD1C5` | Main accent, links, borders, keywords |
| **Light Cyan** | `#81E6D9` | Hover states, variables, highlights |
| **Dark Cyan** | `#38B2AC` | Borders, darker accents |

### Accent Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Pink** | `#EC96B8` | Classes, types, controls |
| **Light Pink** | `#F5A7C0` | Strings, markdown italic |
| **Yellow** | `#F4C471` | Functions, attributes, markdown bold |
| **Gold** | `#E6B55E` | Numbers, constants |

### Background Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Dark Teal** | `#0F2A35` | Terminal, panels, dropdowns |
| **Medium Teal** | `#1A3C47` | Editor background, sidebar |
| **Dark Purple** | `#2D3142` | Secondary buttons, statusbar (no folder) |
| **Muted Gray** | `#607D8B` | Comments, inactive text |

### Foreground Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **White** | `#E8F0F2` | Primary text |
| **Light Blue-Gray** | `#B0C4DE` | Secondary text, punctuation |
| **Very Light Cyan** | `#B8E6D9` | Parameters |

### Semantic Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Green** | `#27AE60` | Success, added files |
| **Red** | `#FF6B6B` | Errors, deleted files |

## Theme Features

- **Semantic Highlighting**: Full support for semantic token colors
- **Git Integration**: Color-coded git decorations (added, modified, deleted, etc.)
- **Terminal Colors**: Complete ANSI color palette matching the theme
- **Symbol Icons**: Colored icons for different symbol types in outline view
- **Accessibility**: High contrast ratios for readability

## How to Use

### After Installing the Extension

1. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Type "Color Theme"
3. Select "Tenstorrent"

### Set as Default Theme

Add to your `settings.json`:
```json
{
  "workbench.colorTheme": "Tenstorrent"
}
```

## Theme Preview

### Syntax Highlighting

- **Keywords**: Bold cyan (`#4FD1C5`)
- **Control Flow**: Bold pink (`#EC96B8`)
- **Functions**: Yellow (`#F4C471`)
- **Classes/Types**: Bold pink (`#EC96B8`)
- **Strings**: Pink (`#F5A7C0`)
- **Numbers**: Gold (`#E6B55E`)
- **Variables**: Light cyan (`#81E6D9`)
- **Comments**: Italic muted gray (`#607D8B`)

### UI Elements

- **Activity Bar**: Dark teal background with cyan accents
- **Sidebar**: Medium teal background
- **Editor**: Medium teal background
- **Panels**: Dark teal background
- **Status Bar**: Dark teal with cyan foreground
- **Buttons**: Cyan with white text

## Matching Extension Elements

The extension's lesson viewer CSS uses the same color palette:

- Command buttons: Cyan gradient with 3D effects
- Headers: Cyan underlines
- Hardware badges: Cyan backgrounds
- Links: Cyan
- Blockquotes: Cyan left borders

This creates a cohesive visual experience across both the VSCode interface and the extension's content.

## Design Philosophy

The theme is designed to:

1. **Reduce Eye Strain**: Dark teal backgrounds are easier on the eyes than pure black
2. **Provide Visual Hierarchy**: Different colors for different code elements
3. **Match Brand**: Aligns with Tenstorrent's website aesthetic
4. **Maintain Readability**: High contrast text with good differentiation
5. **Feel Modern**: Contemporary color choices with pleasant accents

## Color Psychology

- **Cyan/Teal**: Calming, professional, technical
- **Pink**: Friendly, creative, approachable
- **Yellow**: Energetic, attention-grabbing
- **Dark Backgrounds**: Focus-inducing, reduces glare

---

*Based on the color palette from [tenstorrent.com](https://tenstorrent.com)*
