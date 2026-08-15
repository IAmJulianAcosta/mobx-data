/**
 * Compatibility layer spanning MobX 6 and MobX 7.
 *
 * MobX 7 removed the namespaced annotation properties in favour of named
 * exports — `observable.ref` became `observableRef`, `observable.shallow`
 * became `observableShallow`, and so on.  Passing the removed property to
 * `makeObservable` under MobX 7 throws `Invalid annotation`.
 *
 * mobx-data supports both majors, so every annotation it uses is resolved here
 * once at import time: the named export when running against MobX 7, the
 * namespaced property when running against MobX 6.  Modules elsewhere import
 * from this file rather than reaching for either spelling directly.
 *
 * The casts are unavoidable: each spelling is absent from the other major's
 * type definitions, so neither can be read through the published typings.
 */

import * as mobx from 'mobx';
import { observable, type AnnotationMapEntry } from 'mobx';

/** MobX 7 named annotation exports, absent when running against MobX 6. */
interface NamedAnnotationExports {
  observableRef?: AnnotationMapEntry;
  observableShallow?: AnnotationMapEntry;
}

/** MobX 6 namespaced annotation properties, absent when running against MobX 7. */
interface NamespacedAnnotations {
  ref?: AnnotationMapEntry;
  shallow?: AnnotationMapEntry;
}

const namedAnnotations = mobx as unknown as NamedAnnotationExports;
const namespacedAnnotations = observable as unknown as NamespacedAnnotations;

/**
 * Returns whichever spelling the installed MobX provides.
 *
 * @throws when neither is available, which means the installed MobX falls
 *   outside the supported peer range.
 */
function resolveAnnotation(
  named: AnnotationMapEntry | undefined,
  namespaced: AnnotationMapEntry | undefined,
  annotationName: string,
): AnnotationMapEntry {
  const annotation = named ?? namespaced;
  if (annotation === undefined) {
    throw new Error(
      `Unsupported MobX version: no "${annotationName}" annotation found. `
      + 'mobx-data requires mobx ^6.0.0 || ^7.0.0.',
    );
  }
  return annotation;
}

/** `observableRef` (MobX 7) / `observable.ref` (MobX 6). */
export const observableRef = resolveAnnotation(
  namedAnnotations.observableRef,
  namespacedAnnotations.ref,
  'observableRef',
);

/** `observableShallow` (MobX 7) / `observable.shallow` (MobX 6). */
export const observableShallow = resolveAnnotation(
  namedAnnotations.observableShallow,
  namespacedAnnotations.shallow,
  'observableShallow',
);
