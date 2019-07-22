import { ASTElement, ASTNode, ASTText, ASTExpression } from 'vue-template-compiler';

/*
  Module dependencies
*/
var ElementType = require('domelementtype');
var entities = require('entities');

var unencodedElements = {
  __proto__: null,
  style: true,
  script: true,
  xmp: true,
  iframe: true,
  noembed: true,
  noframes: true,
  plaintext: true,
  noscript: true
};

/*
  Format attributes
*/
function formatAttrs(attributes: Record<string, any>, opts:any) {
  if (attributes.length <= 0) return;

  var output = '';

  // Loop through the attributes
  Object.keys(attributes).forEach(key => {
    let value = attributes[key];
    if (output) {
      output += ' ';
    }

    output += key;
    if (value !== null && value !== '') {
      value = value.replace(/"/g, '\'');
      output += '="' + (opts.decodeEntities ? entities.encodeXML(value) : value) + '"';
    }
  });


  return output;
}

/*
  Self-enclosing tags (stolen from node-htmlparser)
*/
var singleTag:any = {
  __proto__: null,
  area: true,
  base: true,
  basefont: true,
  br: true,
  col: true,
  command: true,
  embed: true,
  frame: true,
  hr: true,
  img: true,
  input: true,
  isindex: true,
  keygen: true,
  link: true,
  meta: true,
  param: true,
  source: true,
  track: true,
  wbr: true,
};


export default function render(ast: ASTNode | undefined, opts: any) {
  if (!ast) {
    return '';
  }
  opts = opts || {};
  opts.reserveTags = opts.reserveTags || ['text'];

  var output = '';

  if (ast.type === 1)
    output += renderTag(ast, opts);
  else if (ast.type === 2)
    output += renderExpression(ast, opts);
  else if (ast.type === 3)
    output += renderText(ast, opts);
  else
    console.log(ast);

  return output;
};

function renderTag(elem: ASTElement, opts: Options) {
  if (elem.tag === 'global-wrap') {
    var tag = ''
    if (elem.children) {
      elem.children.forEach(item => {
        tag += render(item, opts)
      })
    }
    return tag
  };

  // Handle SVG
  if (elem.tag === "svg") opts.xmlMode = true;

  var tag = '<' + elem.tag,
      attribs = formatAttrs(elem.attrsMap, opts);
  if (attribs) {
    tag += ' ' + attribs;
  }

  if (
    opts.xmlMode
    && (!elem.children || elem.children.length === 0)
  ) {
    tag += '/>';
  } else {
    tag += '>';
    if (elem.children) {
      elem.children.forEach(item => {
        tag += render(item, opts)
      });
    }

    if (!singleTag[elem.tag] || opts.xmlMode) {
      tag += '</' + elem.tag + '>';
    }
  }

  return tag;
}

function renderExpression(elem:ASTExpression, opts: Options) {
  return elem.text;
}

function renderText(elem: ASTText, opts: Options) {
  var data = elem.text || '';
  // if (opts.minimize) {
  //   data = data.replace(/\n/g, '').trim();
  // }

  // // if entities weren't decoded, no need to encode them back
  // if (opts.decodeEntities) {
  //   data = entities.encodeXML(data);
  // }

  return data;
}

export interface Element {
  type: string,
  name: string,
  data?: string,
  children: Element[],
  parent?: Element,
  attribs: {[key: string]: string}
}

interface Options {
  minimize: boolean,
  xmlMode?: boolean,
  decodeEntities?: boolean,
  reserveTags: string[]
}