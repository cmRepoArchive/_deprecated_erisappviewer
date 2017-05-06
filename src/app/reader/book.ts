import {BookMeta} from "./meta";
import args from "../lib/args";
import {Config} from "../config.service";

export class Book {
  locator: string;
  meta: BookMeta;
  _current: number;
  total: number;
  _onPage: Function[] = [];

  constructor(path: string, private config: Config) {
    this.locator = path;
  }


  get current(): number {
    return this._current;
  }

  set current(page: number) {
    const old = this._current;
    this._current = page;
    this._onPage.forEach(cb => cb(page, old));
  }

  async init(): Promise<any> {
    await args.wait();
    const url = new URL(`https://localhost:${args.port}/book`);
    url['searchParams'].append('locator', this.locator);
    const data = await fetch(url.href);
    this.meta = await data.json();
    if (!this.meta.Pages || !this.meta.Pages.length) {
      return 'no pages';
    }
    this.total = this.meta.Pages.length;
    this.current = 1;
  }

  private checkPage(page: number) {
    if (page > 0 && page <= this.total) {
      return true;
    }
  }

  updateCurrent(page: number): boolean {
    const ok = this.checkPage(page);
    if (ok) {
      this.current = page;
    }
    return ok;
  }

  go(pageOrOffset: number, relative: boolean = false): boolean {
    const page = relative ? this.current + pageOrOffset : pageOrOffset;
    const ok = this.checkPage(page);
    if (ok) {
      if (this.config.isSinglePage()) {
        this.current = page;
      }
    }
    return ok;
  }

  prev(page?: number): boolean {
    return this.go((page || 0) - 1, !page);
  }

  next(page?: number): boolean {
    return this.go((page || 0) + 1, !page);
  }

  getPageFilePath(imgLocator: string) {
    const url = new URL(`https://localhost:${args.port}/book/page`);
    url['searchParams'].append('locator', this.locator);
    url['searchParams'].append('page', imgLocator);
    return url.href;
  }

  onPage(callback: (n?: number, old?: number) => void) {
    this._onPage.push(callback);
  }

  onPageRemove(callback: (n?: number, old?: number) => void) {
    this._onPage = this._onPage.filter(cb => cb !== callback);
  }

  getLastReadIndex() {
    return this.meta.Pages.map(pm => pm.Locator).indexOf(this.meta.LastRead);
  }
}
