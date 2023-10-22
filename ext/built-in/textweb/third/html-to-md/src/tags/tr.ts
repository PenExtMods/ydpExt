import Tag from '../Tag'
import __Ignore__ from './__ignore__'
import { getTagConstructor } from '../utils'
import config from '../config'
import { ParseOptions, TagOptions } from '../type'

class Tr extends Tag {
  constructor(str: string, tagName = 'tr', options: TagOptions) {
    super(str, tagName, options)
  }

  beforeMergeSpace(content: string) {
    
    //fix when thead less than col number
    var count = content.replace(/(\\\|)/g,'').split('|').length - 1;
    if (count>this.tableColumnCount) {
      console.warn('This <tr> is abnormal','\n',this.rawStr,'\n',content,'\n',this.tableColumnCount,count);
      count = this.tableColumnCount;
    }
    //console.log(this.rawStr,content,this.tableColumnCount,count);
    return '|' + content + '|'.repeat(this.tableColumnCount-count);

    //return '|' + content
  }

  parseValidSubTag(
    subTagStr: string,
    subTagName: string,
    options: ParseOptions
  ) {
    const { aliasTags } = config.get()
    const SubTagClass = getTagConstructor(subTagName)
    if (
      subTagName !== 'td' &&
      subTagName !== 'th' &&
      aliasTags?.[subTagName] !== 'td' &&
      aliasTags?.[subTagName] !== 'th' &&
      SubTagClass !== __Ignore__
    ) {
      console.error(
        `Should not have tags except <td> or <th> inside <tr>, current tag is ${subTagName} have been ignore.`
      )
      return ''
    } else {
      const subTag = new SubTagClass(subTagStr, subTagName, options)
      return subTag.exec('', '')
    }
  }

  parseOnlyString() {
    return ''
  }

  exec(prevGap = '', endGap = '\n') {
    return super.exec(prevGap, endGap)
  }
}
export default Tr
