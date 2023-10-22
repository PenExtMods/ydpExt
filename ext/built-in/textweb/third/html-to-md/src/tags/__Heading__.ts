import Tag from '../Tag'
import { TagOptions } from '../type';

class __Heading__ extends Tag {
  constructor(str: string, tagName = 'h1',options:TagOptions) {
    super(str, tagName,options)
    this.match = '#'
  }

  beforeMergeSpace(content: string) {
    
    // AFT smart head
    if (typeof this.extraData == 'object' && this.match!=null){
      if (this.extraData.head.level>this.match.length){
        this.extraData.head.level = this.match.length;
        this.extraData.head.txt = content.split('\n')[0].replace(/[\\/\n\r\t]/g,'');
      }
    }

    return this.match + ' ' + content
  }

  exec(prevGap: string, endGap: string) {
    if (!prevGap) prevGap = '\n'
    if (!endGap) endGap = '\n'
    return super.exec(prevGap, endGap)
  }
}

export default __Heading__
