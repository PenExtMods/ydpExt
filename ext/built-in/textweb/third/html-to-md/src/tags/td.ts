import { ParseOptions, TagOptions } from '../type'
import { __Empty__ } from './__empty__';
import Th from './th'

class Td extends Th {
  constructor(str: string, tagName = 'td', options: TagOptions) {
    super(str, tagName, options)
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
export default Td
