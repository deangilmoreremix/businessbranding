// react-konva 18.x does not ship typings for its shape components; loosely type the ones we use.
declare module 'react-konva' {
  import type { ComponentType } from 'react';
  export const Stage: ComponentType<any>;
  export const Layer: ComponentType<any>;
  export const Image: ComponentType<any>;
  export const Text: ComponentType<any>;
  export const Rect: ComponentType<any>;
  export const Transformer: ComponentType<any>;
}
