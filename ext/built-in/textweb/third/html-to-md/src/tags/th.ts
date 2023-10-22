import Tag from '../Tag'
import { ParseOptions, TagOptions } from '../type'
import { __Empty__ } from './__empty__'

class Th extends Tag {
  constructor(str: string, tagName = 'th', options: TagOptions) {
    super(str, tagName, options)
    this.tagName = tagName
  }

  beforeMergeSpace(content: string) {
    return content + '|'
  }

  parseValidSubTag(
    subTagStr: string,
    subTagName: string,
    options: ParseOptions
  ) {
    if (
      subTagName === 'ul' ||
      subTagName === 'ol' ||
      subTagName === 'table' //||
      //subTagName === 'pre' fix inTable
    ) {
      //fix inTable
      const subTag = new __Empty__(subTagStr,subTagName,{
        ...options,
        inTable: true,
        keepSpace: false,
      });
      return ` ${subTag.exec().replace(/([\n\r])/g, '')} `.replace(/(?<=[^\\])(\|)/g,'\\|').trim();
      //return subTagStr.replace(/([\n\r])/g, '')
    }
    return super.parseValidSubTag(subTagStr, subTagName, options)
  }

  exec(prevGap = '', endGap = '') {
    return super.exec(prevGap, endGap)
  }
}
export default Th
