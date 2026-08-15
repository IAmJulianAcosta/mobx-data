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
/** `observableRef` (MobX 7) / `observable.ref` (MobX 6). */
export declare const observableRef: mobx.AnnotationMapEntry;
/** `observableShallow` (MobX 7) / `observable.shallow` (MobX 6). */
export declare const observableShallow: mobx.AnnotationMapEntry;
//# sourceMappingURL=mobxCompatibility.d.ts.map