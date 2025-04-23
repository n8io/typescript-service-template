const GID_PREFIX = '999'
const GID_DELIMITER = '.'
const STATIC_UUID = '00000000-0000-0000-0000-000000000000'

const gid = (uuid?: string) => `${GID_PREFIX}${GID_DELIMITER}${uuid ?? crypto.randomUUID()}`
const exampleGid = (isRandom = false) => gid(isRandom ? crypto.randomUUID() : STATIC_UUID)

export { exampleGid, gid, GID_DELIMITER, GID_PREFIX }
