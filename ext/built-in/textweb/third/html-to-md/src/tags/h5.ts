import { TagOptions } from '../type'
import __Heading__ from './__Heading__'

class H5 extends __Heading__ {
  constructor(str: string, tagName = 'h5',options:TagOptions) {
    super(str, tagName,options)
    this.match = '#####'
  }

  exec(prevGap = '\n', endGap = '\n') {
    return super.exec(prevGap, endGap)
  }
}

export default H5
