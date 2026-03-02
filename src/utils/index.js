import { pinyin } from 'pinyin-pro'

/**
 * 获取字符串的拼音（不带声调）
 * @param {string} str 中文字符串
 * @returns {string} 拼音字符串（空格分隔）
 */
export function getPinyin(str) {
  return pinyin(str, {
    toneType: 'none',
    type: 'string',
    separator: ' '
  })
}
export function pinyinIncludes(fullStr = '', regStr = "") {
  if (regStr == "") return true
  fullStr = fullStr.trim().toLowerCase();
  regStr = pinyin(regStr.trim().toLowerCase(), {
    toneType: 'none',
    type: 'string',
    separator: ''
  });
  const p = pinyin(fullStr, {
    toneType: 'none',
    multiple: true,
    type: 'all',
  })
  // fullStr的单字拼音中 是否存在一个时 regStr的开头拼音/字符
  for (let i = 0; i < fullStr.length; i++) {
    const arr = pinyin(fullStr[i], {
      toneType: 'none', // 无声调
      multiple: true, // 多音字，单个字时生效
      type: 'array',
    })
    let matchPinyin = ""; // 单字拼音无声调
    let matchPinyin2 = ""; // 首字母
    for (let j = 0; j < arr.length; j++) {
      const word = arr[j];
      if (regStr.startsWith(word)) {
        matchPinyin = word;
        break
      } else if(word.startsWith(regStr)){
        return true;
      } else if (regStr.startsWith(word[0])) {
        matchPinyin2 = word[0];
      }
    }
    if (matchPinyin != "") {
      regStr = regStr.slice(matchPinyin.length);
    } else if (matchPinyin2 != "") {
      regStr = regStr.slice(1);
    }
  }
  if (regStr == "") {
    return true
  } else {
    return false
  }
}
/**
 * 获取字符串的拼音首字母
 * @param {string} str 中文字符串
 * @returns {string} 首字母字符串（大写）
 */
export function getInitials(str) {
  const pinyinStr = pinyin(str, {
    toneType: 'none',
    type: 'array'
  })

  return pinyinStr.map((word) => word.charAt(0).toUpperCase()).join('')
}
