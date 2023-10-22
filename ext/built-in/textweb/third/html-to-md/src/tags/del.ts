import Tag from '../Tag'

class Del extends Tag {
  constructor(str: string, tagName = 'del') {
    super(str, tagName)
    this.match = this.match || '~~'
  }

  beforeMergeSpace(content: string) {
    // fix '~~ a~~' '~~~~' '~~ ~~'
    if (content.trim().length==0) return '';
    return ' '+this.match + content.trim() + this.match+' ';
  }

  exec(prevGap = '', endGap = '') {
    return super.exec(prevGap, endGap)
  }
}

export default Del
