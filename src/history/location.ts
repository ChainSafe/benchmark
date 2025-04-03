import {optionsDefault} from "../cli/options.ts";
import {isGaRun} from "../github/context.ts";
import {StorageOptions} from "../types.ts";

export type HistoryLocation = {type: "local"; path: string} | {type: "ga-cache"; key: string};

export function resolveHistoryLocation(opts: StorageOptions): HistoryLocation {
  if (opts.historyLocal && opts.historyGaCache) {
    throw Error("Must not set 'historyLocal' and 'historyGaCache'");
  }

  if (opts.historyLocal) {
    const filepath = typeof opts.historyLocal === "string" ? opts.historyLocal : optionsDefault.historyLocalPath;
    return {type: "local", path: filepath};
  }

  if (opts.historyGaCache) {
    const cacheKey = typeof opts.historyGaCache === "string" ? opts.historyGaCache : optionsDefault.historyCacheKey;
    return {type: "ga-cache", key: cacheKey};
  }

  // Defaults

  if (isGaRun()) {
    return {type: "ga-cache", key: optionsDefault.historyCacheKey};
  }

  return {type: "local", path: optionsDefault.historyLocalPath};
}
