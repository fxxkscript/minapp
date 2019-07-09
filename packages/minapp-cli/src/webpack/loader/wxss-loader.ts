/******************************************************************
MIT License http://www.opensource.org/licenses/mit-license.php
Author Mora <qiuzhongleiabc@126.com> (https://github.com/qiu8310)
*******************************************************************/

import {Loader} from './Loader'
import {replace, STYLE_RESOURCE_REGEXP, CSS_IMPORT_REGEXP, CSS_COMMENT_IMPORT_REGEXP} from '../util'
const debug = require('debug')('minapp:cli:wxss-loader')
import * as webpack from 'webpack'

@Loader.decorate
export default class WxssLoader extends Loader {
  private ext: string

  constructor(public lc: webpack.loader.LoaderContext) {
    super(lc);

    this.ext = '';
  }

  async run(content: string) {
    // TODO 支持编译到不同的小程序环境
    if (this.options.target === 'weixin') {
      this.ext = '.wxss'
    } else if (this.options.target === 'alipay') {
      this.ext = '.acss'
    } else {
      throw new Error('target is not supported yet')
    }

    debug('FromFile: ' + this.fromFile)
    debug('ToFile: %o', this.toFile)

    this.lc.cacheable()

    let emitContent = await replace(content, STYLE_RESOURCE_REGEXP, async (mat) => {
      let [raw, request] = mat

      if (!this.shouleMakeResolveRequest(request)) return raw

      let absFile = await this.resolve(request)
      if (this.shouleMakeRequireFile(absFile)) {
        let url = await this.loadStaticFile(absFile, request, true)

        debug(`replace ${request} => ${url}`)
        return raw.replace(request, url)
      }

      return raw
    })

    let requires: string[] = []
    emitContent = await replace(emitContent, CSS_IMPORT_REGEXP, async (mat) => {
      let [raw, request, suffix] = mat
      let absFile = await this.resolve(request)
      if (this.shouleMakeRequireFile(absFile)) {
        this.addDependency(absFile)
        requires.push(absFile)
        // wxss 中的 import 在压缩之前需要注释掉，否则 CleanCSS 会报错，在 CleanCSS 处理完再打开
        return addSpecialComment(`@import "${this.getExtractRequirePath(absFile, this.ext)}"${suffix}`, this.minimize)
      }
      return raw
    }, 0)

    if (emitContent.trim()) {
      if (this.minimize) {
        const CleanCSS = require('clean-css')
        let res = new CleanCSS().minify(emitContent)
        if (res.errors.length) this.emitError(new Error(JSON.stringify(res.errors)))
        if (res.warnings.length) this.emitWarning(new Error(JSON.stringify(res.warnings)))
        emitContent = await replace(res.styles, CSS_COMMENT_IMPORT_REGEXP, async (mat) => {
          let [, ipt] = mat
          return ipt
        }, 0)
      }

      // TODO: 入口样式不会有问题，但在 import 中引用的文件如果是空的，不会被 extract，但是引用还是存在；
      this.extract(this.ext, emitContent)
    }

    return this.toRequire(requires)
  }

}

function addSpecialComment(key: string, condition: boolean) {
  return condition ? `/*! ${key} */` : key
}
