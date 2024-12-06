import {StorageOptions} from "../types.js";
import {resolveHistoryLocation} from "./location.js";
import {LocalHistoryProvider} from "./local.js";
import {getGaCacheHistoryProvider} from "./gaCache.js";
import {IHistoryProvider} from "./provider.js";
import {optionsDefault} from "../cli/options.js";
import {S3HistoryProvider} from "./s3.js";
export {resolveHistoryLocation};

export function getHistoryProvider(opts: StorageOptions): IHistoryProvider {
  if (opts.historyGaCache) {
    const cacheKey = typeof opts.historyGaCache === "string" ? opts.historyGaCache : optionsDefault.historyCacheKey;
    return getGaCacheHistoryProvider(cacheKey);
  }

  if (opts.historyS3) {
    return S3HistoryProvider.fromEnv();
  }

  // if opts.historyLocal or else
  const dirpath = typeof opts.historyLocal === "string" ? opts.historyLocal : optionsDefault.historyLocalPath;
  return new LocalHistoryProvider(dirpath);
}
