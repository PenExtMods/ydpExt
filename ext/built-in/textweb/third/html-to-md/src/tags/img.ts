import { picProcess } from '../AFT'
import SelfCloseTag from '../SelfCloseTag'
import { SelfCloseTagOptions } from '../type'

class Img extends SelfCloseTag {
  constructor(str: string, tagName = 'img', options: SelfCloseTagOptions) {
    super(str, tagName, options)
  }

  beforeMergeSpace() {
    let { src, alt } = this.attrs
    //if (!alt) alt = ''
    if (!src) src = ''

    // kill alt
    alt = 'pic';

    src = src.trim();

    // empty check
    if (src.trim().length==0) return '';
    //if (alt.trim().length==0) alt = 'pic';

    // escape "()" and "`" for src
    //src = ` ${src} `;
    //let vaildSrc = ` ${src} `.replace(/(?<=[^\\+])[\(]/g, '\\(').replace(/(?<=[^\\+])[\)]/g, '\\)').replace(/(?<=[^\\+])[\`]/g, '\\\`').replace(/[\n\r]/g,'').trim();
    //src = src.replace(/(?<=[^\\+])[\(]/g, '\\(').replace(/(?<=[^\\+])[\)]/g, '\\)').replace(/(?<=[^\\+])[\`]/g, '\\\`').replace(/[\n\r]/g,'').trim();
    if (!src.includes('%')) src = encodeURI(src);

    // AFT pic wrap
    //console.log(alt,src,this.extraData);
    if (typeof this.extraData == 'object'){
      src = picProcess(src,this.extraData.nowUrl,this.extraData.processServerHost,this.extraData.processPicOpt,this.extraData.processSvgPicOpt);
      if (src.trim().length==0) return '';
      if (!this.extraData.pics.includes(src)) this.extraData.pics.push(src);
      var pos = this.extraData.pics.indexOf(src);
      if (this.inTable) return `![${alt}](${src})${(pos==-1)?'':`\\[p${pos}\\]`}`;
      if (this.picNoWrap) return `\\[  \n![${alt}](${src})\n${(pos==-1)?'':`\\[p${pos}\\]`}\\]  `;
      return `  \n\n  \n![${alt}](${src})  \n\n\n${(pos==-1)?'':`\\[p${pos}\\]`}  `;
    }

    return `![${alt}](${src})`
  }

  exec(prevGap = '', endGap = '') {
    return super.exec(prevGap, endGap)
  }
}
export default Img
