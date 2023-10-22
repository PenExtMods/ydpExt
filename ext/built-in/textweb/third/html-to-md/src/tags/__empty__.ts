import Tag from '../Tag'
import SelfCloseTag from '../SelfCloseTag'
import { ParseOptions, TagName, TagOptions } from '../type'
import { getTagConstructor } from '../utils';
import __Ignore__ from './__ignore__';
/*
 *
 * <div><b>abc</b></div>
 * ==> abc
 *
 * */
class __Empty__ extends Tag {
  constructor(
    str: string,
    tagName: TagName = '__empty__',
    options: TagOptions
  ) {
    super(str, tagName, options)
  }

  slim(content: string) {
    if (this.inTable) return super.slim(content);
    return content
  }

  parseValidSubTag(
    subTagStr: string,
    subTagName: TagName,
    options: ParseOptions
  ) {
    if (this.inTable && subTagName!=null){
      var SubTagClass = getTagConstructor(subTagName);
      if (SubTagClass===__Ignore__){
        return new SubTagClass(subTagStr,subTagName,options).exec();
      }
    }
    return new __Empty__(subTagStr, subTagName, {
      ...options,
    }).exec()
  }

  parseOnlyString(subTagStr: string, subTagName: null, options: ParseOptions) {
    //fix inTable
    if (this.inTable) return subTagStr.trim();

    return subTagStr
  }

  exec() {
    return super.exec('', '')
  }

  beforeReturn(content: string): string {
    if (this.inTable) return ` ${content.trim()} `;
    return content;
  }

}

class __EmptySelfClose__ extends SelfCloseTag {
  constructor(str: string, tagName = '__emptyselfclose__') {
    super(str, tagName)
    this.tagName = tagName
  }

  exec() {
    return super.exec('', '')
  }

  beforeReturn(content: string): string {
    if (this.inTable) return content.trim();
    return content;
  }

}

export { __Empty__, __EmptySelfClose__ }
