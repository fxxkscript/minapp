/******************************************************************
 MIT License http://www.opensource.org/licenses/mit-license.php
 Author Mora <qiuzhongleiabc@126.com> (https://github.com/qiu8310)
*******************************************************************/

import {resolve, join} from 'path'
import { Env } from '../config/env'
export {ExtractMinappCode} from './plugin/ExtractMinappCode'
export {WriteFile} from './plugin/WriteFile'
export {RemoveLessCache} from './plugin/RemoveLessCache'

// postcss plugins
import {px2rpx} from './postcss/px2rpx'
import * as autoprefixer from 'autoprefixer'

let loaderDir = resolve(join(__dirname, 'loader'))

function toLoader(key: string, options: {[key: string]: any} = {}) {
  return {loader: join(loaderDir, key), options}
}

export function getLoader(env: Env) {

  let {browsers, unitTransformer, json2sassPath, target} = env.minapp.compiler

  let plugins: any[] = []
  if (Object.keys(unitTransformer).length) {
    plugins.push(px2rpx(unitTransformer))
  }

  plugins.push(autoprefixer({
    // https://github.com/ai/browserslist#queries
    browsers,
    remove: false,
    add: true
  }))

  let WX = false;
  let ALIPAY = false;
  if (target === 'weixin') {
    WX = true;
  }
  if (target === 'alipay') {
    ALIPAY = true;
  }

  return {
    json: toLoader('json-loader', {}),
    json2sass: toLoader('json2sass-loader', {path: json2sassPath}),
    js: toLoader('js-loader', {}),
    wxs: toLoader('wxs-loader', {}),
    wxml: toLoader('template-loader', {target}),
    axml: toLoader('template-loader', {target}),
    pug: toLoader('pug-loader', {}),
    wxss: toLoader('wxss-loader', {target}),
    acss: toLoader('wxss-loader', {target}),
    postcss: toLoader('postcss-loader', {plugins}),
    ifdef: (options:object) => toLoader('ifdef-loader', {WX, ALIPAY, DEBUG: env.mode === 'development', ...options})
  }
}
