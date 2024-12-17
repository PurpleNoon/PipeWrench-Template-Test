export const itemDataConverterI18nPrefix = 'ItemTransfer'

export function createFailResult(reason: string) {
  return {
    reason,
    reasonI18n: `IGUI_${itemDataConverterI18nPrefix}_${reason}`,
  }
}

export const stringIsNullOrEmpty = (str?: string) => {
  return str === undefined || str.length === 0
}

export const stringIsWhitespace = (str?: string) => {
  if (stringIsNullOrEmpty(str)) {
    return false
  }
  const [result] = string.match(str!, '^%s+$')
  return !!result
}

export const isNullOrWhitespace = (str?: string) => {
  return stringIsNullOrEmpty(str) || stringIsWhitespace(str)
}
