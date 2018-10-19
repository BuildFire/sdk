
// BuildfireComponents: Custom Elements Define Library, ES Module/es2017 Target

import { defineCustomElement } from './buildfire-components.core.js';
import {
  Grid,
  Grid1,
  ImageList,
  Img
} from './buildfire-components.components.js';

export function defineCustomElements(win, opts) {
  return defineCustomElement(win, [
    Grid,
    Grid1,
    ImageList,
    Img
  ], opts);
}
