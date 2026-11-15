import React from 'react';
import * as ReactNative from 'react-native';

/**
 * Global Text & TextInput configuration:
 * Enforces identical typography, line metrics, and layout behavior across Android and iOS
 * regardless of OS system font accessibility scale, screen density, or screen width.
 */

const OriginalText = ReactNative.Text;
const OriginalTextInput = ReactNative.TextInput;

// 1. Fallback for environments honoring defaultProps
try {
  if ((OriginalText as any).defaultProps == null) {
    (OriginalText as any).defaultProps = {};
  }
  (OriginalText as any).defaultProps.allowFontScaling = false;
  (OriginalText as any).defaultProps.maxFontSizeMultiplier = 1;
} catch (e) {
  // Ignore
}

try {
  if ((OriginalTextInput as any).defaultProps == null) {
    (OriginalTextInput as any).defaultProps = {};
  }
  (OriginalTextInput as any).defaultProps.allowFontScaling = false;
  (OriginalTextInput as any).defaultProps.maxFontSizeMultiplier = 1;
} catch (e) {
  // Ignore
}

// 2. Component interception for React 19 where defaultProps is deprecated on function components
const ConsistentText = React.forwardRef((props: any, ref: any) => {
  const { allowFontScaling = false, maxFontSizeMultiplier = 1, style, ...rest } = props;
  return React.createElement(OriginalText, {
    allowFontScaling,
    maxFontSizeMultiplier,
    style: [{ includeFontPadding: false }, style],
    ...rest,
    ref,
  });
});
(ConsistentText as any).displayName = 'Text';
Object.assign(ConsistentText, OriginalText);

try {
  Object.defineProperty(ReactNative, 'Text', {
    configurable: true,
    enumerable: true,
    get: () => ConsistentText,
  });
} catch (e) {
  (ReactNative as any).Text = ConsistentText;
}

const ConsistentTextInput = React.forwardRef((props: any, ref: any) => {
  const { allowFontScaling = false, maxFontSizeMultiplier = 1, ...rest } = props;
  return React.createElement(OriginalTextInput, {
    allowFontScaling,
    maxFontSizeMultiplier,
    ...rest,
    ref,
  });
});
(ConsistentTextInput as any).displayName = 'TextInput';
Object.assign(ConsistentTextInput, OriginalTextInput);

try {
  Object.defineProperty(ReactNative, 'TextInput', {
    configurable: true,
    enumerable: true,
    get: () => ConsistentTextInput,
  });
} catch (e) {
  (ReactNative as any).TextInput = ConsistentTextInput;
}

export {};
