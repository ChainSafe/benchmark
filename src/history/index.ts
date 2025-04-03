import {optionsDefault} from "../cli/options.ts";
import {StorageOptions} from "../types.ts";
import {getGaCacheHistoryProvider} from "./gaCache.ts";
import {LocalHistoryProvider} from "./local.ts";
import {resolveHistoryLocation} from "./location.ts";
import {IHistoryProvider} from "./provider.ts";
import {S3HistoryProvider} from "./s3.ts";

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
