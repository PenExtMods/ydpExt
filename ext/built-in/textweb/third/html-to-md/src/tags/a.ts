import { smartURL, wrapPic } from '../AFT'
import Tag from '../Tag'
import { ParseOptions, TagName, TagOptions } from '../type'

class A extends Tag {
  constructor(str: string, tagName = 'a', options: TagOptions) {
    super(str, tagName, options)
  }

  beforeMergeSpace(content: string) {
    var { href, title } = this.attrs

    href = href ? href : '';
    // () escape
    const validHref = href ? ` ${href} `.replace(/(?<=[^\\+])[\(]/g, '\\(').replace(/(?<=[^\\+])[\)]/g, '\\)').replace(/(?<=[^\\+])[\`]/g, '\\\`').replace(/[\n\r]/g,'').trim() : ''
    //kill title
    /*
    if (title) {
      return `[${content}](${validHref} "${title}")`
    }
    */

    //empty check
    if (content.trim().length==0 && validHref.trim().length==0) return '';

    // AFT pic wrap
    if (typeof this.extraData=='undefined') return ` [${content}](${validHref}) `;

    href = smartURL(href,this.extraData.nowUrl);
    if (!href.includes('%')) href = encodeURI(href);

    var pos = this.extraData.links.indexOf(href);
    if (!this.extraData.links.includes(href) && !validHref.startsWith('#') && !validHref.startsWith('javascript:') && validHref.trim().length>0){
      this.extraData.links.push(href);
      pos = this.extraData.links.length-1;
      //console.log(pos);
    }

    return wrapPic('a',this.picNoWrap,content,validHref,1,pos);

  }

  // AFT pic wrap
  parseValidSubTag(subTagStr: string, subTagName: string, options: ParseOptions): string {
    if (typeof this.extraData=='undefined') return super.parseValidSubTag(subTagStr,subTagName,options);
    var opt = Object.assign({},options);
    opt.picNoWrap = true;
    return super.parseValidSubTag(subTagStr,subTagName,opt);
  }

  parseOnlyString(
    subTagStr: string,
    subTagName: TagName,
    options: ParseOptions
  ) {
    if (this.parentTag === 'tbody' || this.parentTag === 'thead') {
      return subTagStr
    }
    return super.parseOnlyString(subTagStr, subTagName, options)
  }

  exec(prevGap = '', endGap = '') {
    return super.exec(prevGap, endGap)
  }
}

export default A
