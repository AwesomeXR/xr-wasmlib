import { WasmLib } from './WasmLib';

export class Basisu extends WasmLib {
  constructor() {
    super(require('xr-wasmlib-emcc-build/lib/basisu'));
  }

  async init() {
    await (this.wmFactory as any)({ noInitialRun: true }).then((m: any) => {
      this.wm = m;
    });
    return this;
  }

  /**
   * 打包 ktx2
   *
   * @param [opt.uastc] Enable UASTC texture mode, instead of the default ETC1S mode. Significantly higher texture quality, but larger files. (Note that UASTC .basis files must be losslessly compressed by the user.)
   * @param [opt.uastc_level] Set UASTC encoding level. Range is [0,4], default is 2, higher=slower but higher quality. 0=fastest/lowest quality, 3=slowest practical option, 4=impractically slow/highest achievable quality
   *
   * @param [opt.ktx2_no_zstandard] Don't compress UASTC texture data using Zstandard, store it uncompressed instead.
   * @param [opt.linear] Use linear colorspace metrics (instead of the default sRGB), and by default linear (not sRGB) mipmap filtering.
   * @param [opt.y_flip] Flip input images vertically before compression
   * @param [opt.normal_map] Tunes codec parameters for better quality on normal maps (linear colorspace metrics, linear mipmap filtering, no selector RDO, no sRGB)
   */
  pack2KTX2(
    imageData: Uint8Array,
    imgExt: string,
    opt: {
      uastc?: boolean;
      ktx2_no_zstandard?: boolean;
      linear?: boolean;
      uastc_level?: number;
      y_flip?: boolean;
      normal_map?: boolean;
    } = {}
  ): Uint8Array {
    const basename = WasmLib.uid();
    const inPath = basename + imgExt;
    const outPath = basename + '.ktx2';

    const cleanFiles = () => {
      if (this.FS.analyzePath(inPath).exists) this.FS.unlink(inPath);
      if (this.FS.analyzePath(outPath).exists) this.FS.unlink(outPath);
    };

    try {
      this.FS.writeFile(inPath, imageData);

      // prettier-ignore
      const args: string[] = ['-ktx2', '-mipmap'];
      if (opt.uastc) args.push('-uastc');
      if (opt.ktx2_no_zstandard) args.push('-ktx2_no_zstandard');
      if (opt.linear) args.push('-linear');
      if (opt.uastc_level) args.push('-uastc_level', opt.uastc_level + '');
      if (opt.y_flip) args.push('-y_flip');
      if (opt.normal_map) args.push('-normal_map');

      args.push(inPath);

      this.callCLI('main', args);

      const ret = this.FS.readFile(outPath);
      cleanFiles();

      return ret;
    } catch (err) {
      cleanFiles();
      throw err;
    }
  }

  getInfo(imageData: Uint8Array, imgExt: string) {
    const basename = WasmLib.uid();
    const inPath = basename + imgExt;

    const cleanFiles = () => {
      if (this.FS.analyzePath(inPath).exists) this.FS.unlink(inPath);
    };

    try {
      this.FS.writeFile(inPath, imageData);
      this.callCLI('main', ['-info', inPath]);

      // const ret = this.FS.readFile(outPath);
      cleanFiles();

      // return ret;
    } catch (err) {
      cleanFiles();
      throw err;
    }
  }
}
