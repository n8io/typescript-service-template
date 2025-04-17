const GID_PREFIX = '999'
const GID_DELIMITER = '.'

const gid = () => `${GID_PREFIX}${GID_DELIMITER}${crypto.randomUUID()}`

const exampleGid = (isRandom = false) => {
  if (isRandom) {
    return gid()
  }

  return `${GID_PREFIX}${GID_DELIMITER}00000000-0000-0000-0000-000000000000`
}

export { exampleGid, gid, GID_DELIMITER, GID_PREFIX }
