export type ICArg = 'string' | 'number' | 'boolean' | 'array' | null;

export class WasmLib {
  static uid(length = 8) {
    return Math.random()
      .toString(32)
      .slice(2, 2 + length);
  }

  protected wm: any;

  constructor(protected wmFactory: () => Promise<any>) {
    if (typeof wmFactory !== 'function') throw new Error('wmFactory is not a function');
  }

  async init() {
    await this.wmFactory().then(m => {
      this.wm = m;
    });
    return this;
  }

  get isInitd() {
    return !!this.wm;
  }

  get HEAP8(): Int8Array {
    return this.wm.HEAP8;
  }
  get HEAP16(): Int16Array {
    return this.wm.HEAP16;
  }
  get HEAP32(): Int32Array {
    return this.wm.HEAP32;
  }
  get HEAPU8(): Uint8Array {
    return this.wm.HEAPU8;
  }
  get HEAPU16(): Uint16Array {
    return this.wm.HEAPU16;
  }
  get HEAPU32(): Uint32Array {
    return this.wm.HEAPU32;
  }
  get HEAPF32(): Float32Array {
    return this.wm.HEAPF32;
  }
  get HEAPF64(): Float64Array {
    return this.wm.HEAPF64;
  }

  get _malloc(): (size: number) => number {
    return this.wm._malloc;
  }

  get _free(): (ptr: number) => void {
    return this.wm._free;
  }

  ccall<T>(ident: string, returnType: ICArg, argTypes: ICArg[], args: any[]): T {
    return this.wm.ccall(ident, returnType, argTypes, args);
  }

  cwrap<T extends (...args: any[]) => any>(ident: string, returnType: ICArg, argTypes: ICArg[]) {
    const fn: any = (...args: any[]) => this.ccall<any>(ident, returnType, argTypes, args);
    return fn as T;
  }

  get FS(): {
    readFile(path: string): Uint8Array;
    readFile(path: string, opt?: { encoding: 'binary' }): Uint8Array;
    readFile(path: string, opt?: { encoding: 'utf8' }): string;
    writeFile(path: string, data: string | Uint8Array): void;
    unlink(path: string): void;
    stat(path: string): { size: number } | undefined;
    analyzePath(path: string): { isRoot: boolean; exists: boolean };
  } {
    return this.wm.FS;
  }

  createCLIArgv(args: string[]) {
    const subPtrs: number[] = [];

    args.forEach(arg => {
      // 分配指针，写入字符串
      const p = this._malloc(arg.length + 1);
      // prettier-ignore
      this.HEAP8.set([...arg.split('').map(c => c.charCodeAt(0)), 0], p);

      subPtrs.push(p);
    });

    // 分配二级指针
    const argvPtr = this._malloc(subPtrs.length * 4);
    this.HEAPU32.set(subPtrs, argvPtr / 4);

    const argc = args.length;

    const free = () => {
      [argvPtr, ...subPtrs].forEach(p => this._free(p));
    };

    return { argc, argvPtr, free };
  }

  callCLI(cmd: string, args: string[]) {
    const argv = this.createCLIArgv([cmd, ...args]);

    try {
      console.log(`>>> call ${cmd}: ${args.join(' ')}`);

      const errno = this.ccall<number>(
        cmd,
        'number',
        ['number', 'number'],
        [argv.argc, argv.argvPtr]
      );

      if (errno !== 0) throw new Error('exist with ' + errno);

      argv.free();
    } catch (err) {
      argv.free();
      throw err;
    }
  }
}
