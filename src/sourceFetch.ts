import {fetchHtml, type FetchOptions} from "./fetch";
import {fetchWikipediaHtml, isWikipediaUrl} from "./wikipediaFetch";

export function fetchSourceHtml(url: string, options?: FetchOptions): Promise<string> {
    return isWikipediaUrl(url)
        ? fetchWikipediaHtml(url, options)
        : fetchHtml(url, options);
}
